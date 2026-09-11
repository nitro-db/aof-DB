# SPDX-FileCopyrightText: 2026 INTERCHAINED LLC
# SPDX-License-Identifier: BUSL-1.1
# aof-db · a distribution of NEDB · © 2026 INTERCHAINED LLC × Eth-Interchained × Vex (Claude Opus 5)

"""
nedb.query — NQL (the NEDB Query Language) parser + the fluent query builder.

Both the text form and the fluent builder compile to the SAME plan dict, so the two
front-ends share identical semantics. In the production engine the parser lives once
in Rust; Python and Node get the exact same grammar for free.

NQL grammar (keywords case-insensitive):

    FROM <collection>
      [ AS OF <seq> ]
      [ WHERE <field> <op> <value> (AND <field> <op> <value>)* ]
      [ SEARCH "<text>" ]
      [ ORDER BY <field> [ASC|DESC] ]
      [ TRAVERSE <relation> ]
      [ LIMIT <n> ]

    op    := = | != | < | <= | > | >=
    value := number | "string" | 'string' | true | false | null
"""
from __future__ import annotations

import re
from typing import Any, List, Optional, Tuple

_TOKEN_RE = re.compile(
    r"""\s+
      | "(?P<dq>[^"]*)"
      | '(?P<sq>[^']*)'
      | (?P<num>-?\d+(?:\.\d+)?)
      | (?P<op><=|>=|!=|=|<|>)
      | (?P<word>[A-Za-z_][A-Za-z0-9_]*)
    """,
    re.VERBOSE,
)

_KEYWORDS = {"from", "as", "of", "where", "and", "search", "order", "by",
             "asc", "desc", "traverse", "trace", "reverse", "limit",
             "valid", "true", "false", "null", "group", "count", "sum", "avg", "min", "max"}


def _lex(text: str) -> List[Tuple[str, Any]]:
    toks: List[Tuple[str, Any]] = []
    pos = 0
    while pos < len(text):
        m = _TOKEN_RE.match(text, pos)
        if not m:
            raise SyntaxError(f"NQL: cannot tokenize near: {text[pos:pos+20]!r}")
        pos = m.end()
        if m.group("dq") is not None:
            toks.append(("str", m.group("dq")))
        elif m.group("sq") is not None:
            toks.append(("str", m.group("sq")))
        elif m.group("num") is not None:
            n = m.group("num")
            toks.append(("num", float(n) if "." in n else int(n)))
        elif m.group("op") is not None:
            toks.append(("op", m.group("op")))
        elif m.group("word") is not None:
            w = m.group("word")
            lw = w.lower()
            toks.append(("kw", lw) if lw in _KEYWORDS else ("word", w))
        # whitespace -> skip
    return toks


def empty_plan(coll: str) -> dict:
    return {"from": coll, "as_of": None, "where": [], "search": None,
            "order_by": None, "traverse": None, "limit": None,
            "group_by": None, "aggregate": None,
            "trace": None, "trace_reverse": False,
            "valid_as_of": None}


def parse_nql(text: str) -> dict:
    toks = _lex(text)
    i = 0

    def peek():
        return toks[i] if i < len(toks) else (None, None)

    def expect_kw(kw):
        nonlocal i
        t, v = peek()
        if t != "kw" or v != kw:
            raise SyntaxError(f"NQL: expected '{kw.upper()}', got {v!r}")
        i += 1

    def value():
        nonlocal i
        t, v = peek()
        if t in ("num", "str"):
            i += 1
            return v
        if t == "kw" and v in ("true", "false", "null"):
            i += 1
            return {"true": True, "false": False, "null": None}[v]
        if t == "word":
            i += 1
            return v
        raise SyntaxError(f"NQL: expected value, got {v!r}")

    expect_kw("from")
    t, v = peek()
    if t not in ("word", "kw"):
        raise SyntaxError("NQL: expected collection after FROM")
    i += 1
    plan = empty_plan(v)

    # AS OF <seq>
    if peek() == ("kw", "as"):
        i += 1
        expect_kw("of")
        t, v = peek()
        if t != "num":
            raise SyntaxError("NQL: AS OF expects an integer seq")
        i += 1
        plan["as_of"] = int(v)

    # VALID AS OF <date>  — bi-temporal valid-time filter
    # Syntax: VALID AS OF "2024-02-15"  (ISO 8601 date or datetime string)
    # Can appear before or after WHERE; "valid" is the disambiguating keyword.
    if peek() == ("kw", "valid"):
        i += 1
        # expect AS OF
        t, v = peek()
        if t == "kw" and v == "as":
            i += 1
        t, v = peek()
        if t == "kw" and v == "of":
            i += 1
        t, v = peek()
        if t != "str":
            raise SyntaxError("NQL: VALID AS OF expects a quoted date string")
        i += 1
        plan["valid_as_of"] = v

    # WHERE ... AND ...
    if peek() == ("kw", "where"):
        i += 1
        while True:
            t, field = peek()
            if t not in ("word", "kw"):
                raise SyntaxError("NQL: expected field in WHERE")
            i += 1
            t, op = peek()
            if t != "op":
                raise SyntaxError("NQL: expected operator in WHERE")
            i += 1
            plan["where"].append((field, op, value()))
            if peek() == ("kw", "and"):
                i += 1
                continue
            break

    # VALID AS OF <date> — also accepted after WHERE (second position)
    if peek() == ("kw", "valid") and plan["valid_as_of"] is None:
        i += 1
        for kw in ("as", "of"):
            if peek()[1] == kw: i += 1
        t, v = peek()
        if t != "str":
            raise SyntaxError("NQL: VALID AS OF expects a quoted date string")
        i += 1
        plan["valid_as_of"] = v

    # SEARCH "text"
    if peek() == ("kw", "search"):
        i += 1
        t, v = peek()
        if t != "str":
            raise SyntaxError("NQL: SEARCH expects a quoted string")
        i += 1
        plan["search"] = v

    # ORDER BY field [ASC|DESC]
    if peek() == ("kw", "order"):
        i += 1
        expect_kw("by")
        t, field = peek()
        if t not in ("word", "kw"):
            raise SyntaxError("NQL: expected field after ORDER BY")
        i += 1
        direction = "ASC"
        if peek() == ("kw", "asc"):
            i += 1
        elif peek() == ("kw", "desc"):
            i += 1
            direction = "DESC"
        plan["order_by"] = (field, direction)

    # TRAVERSE relation
    if peek() == ("kw", "traverse"):
        i += 1
        t, rel = peek()
        if t not in ("word", "kw"):
            raise SyntaxError("NQL: expected relation after TRAVERSE")
        i += 1
        plan["traverse"] = rel

    # TRACE <field> [REVERSE]
    # Walks the causal provenance graph.
    # TRACE caused_by          → backward: which ops caused these documents?
    # TRACE caused_by REVERSE  → forward:  which documents did these ops cause?
    if peek() == ("kw", "trace"):
        i += 1
        t, tf = peek()
        if t not in ("word", "kw"):
            raise SyntaxError("NQL: expected field name after TRACE")
        i += 1
        plan["trace"] = tf
        if peek() == ("kw", "reverse"):
            i += 1
            plan["trace_reverse"] = True

    # LIMIT n
    if peek() == ("kw", "limit"):
        i += 1
        t, v = peek()
        if t != "num":
            raise SyntaxError("NQL: LIMIT expects an integer")
        i += 1
        plan["limit"] = int(v)

    # GROUP BY field [COUNT | SUM field | AVG field | MIN field | MAX field]
    if peek() == ("kw", "group"):
        i += 1
        expect_kw("by")
        t, field = peek()
        if t not in ("word", "kw"):
            raise SyntaxError("NQL: expected field after GROUP BY")
        i += 1
        plan["group_by"] = field
        # optional aggregate after GROUP BY
        t, agg = peek()
        if t == "kw" and agg in ("count", "sum", "avg", "min", "max"):
            i += 1
            if agg == "count":
                plan["aggregate"] = ("count", None)
            else:
                t2, agg_field = peek()
                if t2 not in ("word", "kw"):
                    raise SyntaxError(f"NQL: {agg.upper()} expects a field name")
                i += 1
                plan["aggregate"] = (agg, agg_field)

    if i != len(toks):
        raise SyntaxError(f"NQL: unexpected trailing tokens: {toks[i:]}")
    return plan


def cmp(a, op, b) -> bool:
    try:
        if op == "=":
            return a == b
        if op == "!=":
            return a != b
        if a is None:
            return False
        if op == "<":
            return a < b
        if op == "<=":
            return a <= b
        if op == ">":
            return a > b
        if op == ">=":
            return a >= b
    except TypeError:
        return False
    return False


class Query:
    """Fluent builder that compiles to the same plan dict as NQL text."""

    def __init__(self, engine, coll: str) -> None:
        self._engine = engine
        self.plan = empty_plan(coll)

    def as_of(self, seq: int) -> "Query":
        self.plan["as_of"] = seq
        return self

    def where(self, field: str, op: str, value: Any) -> "Query":
        self.plan["where"].append((field, op, value))
        return self

    def search(self, text: str) -> "Query":
        self.plan["search"] = text
        return self

    def order_by(self, field: str, desc: bool = False) -> "Query":
        self.plan["order_by"] = (field, "DESC" if desc else "ASC")
        return self

    def traverse(self, rel: str) -> "Query":
        self.plan["traverse"] = rel
        return self

    def limit(self, n: int) -> "Query":
        self.plan["limit"] = n
        return self

    def run(self) -> List[dict]:
        return self._engine.execute(self.plan)
