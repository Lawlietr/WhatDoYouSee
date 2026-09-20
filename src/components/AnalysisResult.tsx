"use client";

import { useState } from "react";
import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import type { AnalysisResponse } from "../lib/types";
import { DescriptionView } from "./DescriptionView";
import { DataTableView } from "./DataTableView";
import { useI18n } from "../hooks/useI18n";

type Tab = "description" | "data";

interface AnalysisResultProps {
  result: AnalysisResponse;
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("description");

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={tab}
          onChange={(_, value: Tab | null) => {
            if (value) setTab(value);
          }}
          aria-label={t("result.viewAria")}
        >
          <ToggleButton value="description" aria-label={t("result.descriptionAria")}>
            {t("result.description")}
          </ToggleButton>
          <ToggleButton value="data" aria-label={t("result.dataAria")}>
            {t("result.data")}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {tab === "description" ? (
        <DescriptionView paras={result.paras} />
      ) : (
        <DataTableView table={result.table} />
      )}
    </Box>
  );
}
