import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Autocomplete, Box, TextField, Typography } from "@mui/material";
import axios from "axios";

const GREEN = "#17332a";
const GOLD = "#c9a227";

const peso = (n) =>
  `₱${Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // suggestions: wait 300ms after typing stops, cancel stale requests
  useEffect(() => {
    const keyword = query.trim();
    if (keyword.length < 2) {
      setOptions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_API}/products?keyword=${encodeURIComponent(keyword)}`,
          { signal: controller.signal }
        );
        setOptions((data.products || []).slice(0, 8));
      } catch (err) {
        if (!axios.isCancel(err)) setOptions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // button click / Enter: go to the results page for what was typed
  const handleSearch = (e) => {
    e.preventDefault();
    const keyword = query.trim();
    if (!keyword) return;
    setOpen(false);
    navigate(`/search/${encodeURIComponent(keyword)}`);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSearch}
      className="shop-search-form"
      sx={{ display: "flex", alignItems: "stretch", width: { xs: "100%", lg: 320 } }}
    >
      <Autocomplete
        freeSolo
        fullWidth
        size="small"
        open={open && query.trim().length >= 2}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        options={options}
        loading={loading}
        // the server already filtered the list, so don't filter again
        filterOptions={(x) => x}
        getOptionLabel={(o) => (typeof o === "string" ? o : o.name)}
        isOptionEqualToValue={(a, b) => a?._id === b?._id}
        loadingText="Searching..."
        inputValue={query}
        onInputChange={(e, value) => setQuery(value)}
        // picking a suggestion opens that product (typed text is handled by the form submit)
        onChange={(e, value) => {
          if (value && typeof value !== "string") {
            setOpen(false);
            navigate(`/product/${value._id}`);
          }
        }}
        noOptionsText="No products found"
        renderOption={(props, option) => {
          const { key, ...rest } = props;
          return (
            <Box component="li" key={option._id} {...rest} sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              <Box
                component="img"
                src={option.images?.[0]?.url}
                alt=""
                sx={{ width: 36, height: 36, objectFit: "cover", borderRadius: 1, bgcolor: "#eef3f0", flexShrink: 0 }}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" noWrap sx={{ color: GREEN, fontWeight: 600 }}>
                  {option.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {option.brand ? `${option.brand} · ` : ""}
                  {peso(option.price)}
                </Typography>
              </Box>
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            id="site-search"
            name="search"
            placeholder="Search products..."
            sx={{
              bgcolor: "#fff",
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px 0 0 8px",
                "& fieldset": { borderColor: "transparent" },
                "&:hover fieldset": { borderColor: GOLD },
                "&.Mui-focused fieldset": { borderColor: GOLD },
              },
              "& .MuiAutocomplete-endAdornment .MuiCircularProgress-root": {
                color: GREEN,
                width: "18px !important",
                height: "18px !important",
              },
              borderRadius: "8px 0 0 8px",
            }}
          />
        )}
      />

      <button
        type="submit"
        className="shop-search-btn"
        aria-label="Search"
        style={{
          width: 38,
          minWidth: 38,
          border: 0,
          borderBottom: `3px solid ${GOLD}`,
          borderRadius: "0 8px 8px 0",
          background: GREEN,
          color: "#fff",
          cursor: "pointer",
        }}
      >
        <i className="fa fa-search" style={{ fontSize: 18 }} />
      </button>
    </Box>
  );
}
