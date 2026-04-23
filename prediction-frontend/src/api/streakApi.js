import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Typography from '@mui/material/Typography'
import ExpandMore from '@mui/icons-material/ExpandMore'


export const getStreaks = async () => {
  const res = await fetch("http://localhost:8080/api/streaks/all");

  if (!res.ok) {
    throw new Error("Fetch streaks failed");
  }

  return res.json();
};

export const rebuildStreaks = async () => {
  const res = await fetch("http://localhost:8080/api/streaks/rebuild", {
    method: "POST",
  });

  if (!res.ok) throw new Error("Rebuild failed");

  return res.text();
};