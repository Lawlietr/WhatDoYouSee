"use client";

import { Box, Typography } from "@mui/material";
import { TABLE_GROUPS } from "../lib/providers/system-prompt";

interface DataTableViewProps {
  table: Record<string, string>;
}

interface ParsedCell {
  key: string;
  value: string;
  label: string;
}

interface TableGroup {
  name: string | null;
  cells: ParsedCell[];
}

const CONFIDENCE_COLORS: Record<string, string> = {
  certain: "#66bb6a",
  likely: "#64b5f6",
  speculative: "#ffb74d",
};

function splitKey(key: string): { group: string | null; label: string } {
  const sep = key.indexOf(": ");
  if (sep <= 0) return { group: null, label: key };
  const prefix = key.slice(0, sep);
  const match = (TABLE_GROUPS as readonly string[]).find(
    (g) => g.toLowerCase() === prefix.toLowerCase()
  );
  if (!match) return { group: null, label: key };
  return { group: match, label: key.slice(sep + 2) };
}

function groupEntries(table: Record<string, string>): TableGroup[] {
  const groups: TableGroup[] = [];
  for (const [key, value] of Object.entries(table)) {
    const { group, label } = splitKey(key);
    const existing = groups.find((g) => g.name === group);
    if (existing) {
      existing.cells.push({ key, value, label });
    } else {
      groups.push({ name: group, cells: [{ key, value, label }] });
    }
  }
  return groups;
}

function renderValue(value: string) {
  const m = value.match(/^\[(certain|likely|speculative)\]\s*([\s\S]*)$/);
  if (!m) {
    return (
      <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
        {value}
      </Typography>
    );
  }
  const [, tag, rest] = m;
  return (
    <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
      <Typography
        component="span"
        variant="caption"
        sx={{
          color: CONFIDENCE_COLORS[tag],
          fontWeight: 600,
          mr: 0.75,
          textTransform: "uppercase",
        }}
      >
        {tag}
      </Typography>
      {rest}
    </Typography>
  );
}

export function DataTableView({ table }: DataTableViewProps) {
  const entries = Object.entries(table);

  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.disabled">
        No structured findings.
      </Typography>
    );
  }

  const groups = groupEntries(table);
  const singleFlatGroup =
    groups.length === 1 && groups[0].name === null && groups[0].cells.length === entries.length;

  return (
    <Box
      sx={{
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 2,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
        p: 2,
      }}
    >
      {singleFlatGroup ? (
        <Box
          role="table"
          aria-label="Inferred data"
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
          }}
        >
          {entries.map(([key, value]) => (
            <Box key={key} role="row" sx={{ p: 1, pr: 2, mb: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 0.5 }}
              >
                {key}
              </Typography>
              {renderValue(value)}
            </Box>
          ))}
        </Box>
      ) : (
        groups.map((group, gi) => (
          <Box key={group.name ?? `other-${gi}`}>
            {group.name && (
              <Typography
                variant="caption"
                sx={{
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "text.secondary",
                  display: "block",
                  mb: 1,
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  pb: 0.75,
                }}
              >
                {group.name}
              </Typography>
            )}
            <Box
              role="table"
              aria-label={group.name ? `${group.name} findings` : "Other findings"}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
              }}
            >
              {group.cells.map(({ key, value, label }) => (
                  <Box key={key} role="row" sx={{ p: 1, pr: 2, mb: 1 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.5 }}
                    >
                      {label}
                    </Typography>
                    {renderValue(value)}
                  </Box>
                )
              )}
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
}
