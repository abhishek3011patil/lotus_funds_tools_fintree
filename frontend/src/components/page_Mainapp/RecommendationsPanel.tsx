import { memo, useMemo } from "react";
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
} from "@mui/material";
import LoadingPage from "../../common/LoadingPage";

type Props = {
    recommendations: any[];
    loading: boolean;
    onModify: (item: any) => void;
    onExit: (id: string) => void;
    onInitiate: (item: any) => void;
};

const RecommendationsPanel = memo(
    ({ recommendations, loading, onModify, onExit, onInitiate }: Props) => {
        const activeRecommendations = useMemo(
            () => recommendations.filter((item) => item.status === "PUBLISHED"),
            [recommendations]
        );

        const watchlistRecommendations = useMemo(
            () => recommendations.filter((item) => item.status === "DRAFT"),
            [recommendations]
        );

        // const getResearcherName = (item: any) =>
        //     item.researcherName ||
        //     item.researcher ||
        //     item.researcher_name ||
        //     item.createdBy ||
        //     item.created_by ||
        //     item.username ||
        //     "-";

        return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* ================= ACTIVE ================= */}
                <Paper
                    sx={{
                        p: { xs: 1, sm: 2 },
                        overflow: { xs: "visible", sm: "hidden" },
                        borderRadius: 2,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mb: 2,
                        }}
                    >
                        <Typography fontWeight={700} sx={{ fontSize: "0.9rem" }}>
                            Active Recommendations
                        </Typography>

                        <Box
                            sx={{
                                backgroundColor: "#f0f2f5",
                                color: "#000",
                                borderRadius: "6px",
                                px: 1.5,
                                py: 0.2,
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                border: "1px solid #e0e0e0",
                            }}
                        >
                            {activeRecommendations.length}
                        </Box>
                    </Box>

                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                            <LoadingPage
                                title="Loading"
                                subtitle="Fetching recommendations..."
                                fullScreen={false}
                                size={36}
                            />
                        </Box>
                    ) : (
                        <TableContainer
                            sx={{
                                maxHeight: 400,
                                width: "100%",
                                minWidth: 0,
                                overflowX: "auto",
                                WebkitOverflowScrolling: "touch",
                            }}
                        >
                            <Table size="small" stickyHeader sx={{ minWidth: { xs: 420, sm: "auto" } }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontSize: "0.65rem", color: "#999", fontWeight: 700, px: 1, backgroundColor: "#fff" }}>
                                            Published Date
                                        </TableCell>
                                        <TableCell sx={{ fontSize: "0.65rem", color: "#999", fontWeight: 700, px: 1, backgroundColor: "#fff" }}>
                                            Recommendation
                                        </TableCell>
                                        {/* <TableCell sx={{ fontSize: "0.65rem", color: "#999", fontWeight: 700, px: 1, backgroundColor: "#fff" }}>
                                            Researcher Name
                                        </TableCell> */}
                                        <TableCell align="right" sx={{ fontSize: "0.65rem", color: "#999", fontWeight: 700, px: 1, backgroundColor: "#fff" }}>
                                            Action
                                        </TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {activeRecommendations.length > 0 ? (
                                        activeRecommendations.map((item) => {
                                            const dateObj = new Date(item.created_at);

                                            return (
                                                <TableRow
                                                    key={item.id}
                                                    sx={{
                                                        "&:last-child td, &:last-child th": { border: 0 },
                                                        "&:hover": { backgroundColor: "#fcfcfc" },
                                                    }}
                                                >
                                                    <TableCell sx={{ px: 1, py: 1.5 }}>
                                                        <Typography sx={{ fontSize: "0.65rem", color: "#666", fontWeight: 500 }}>
                                                            {dateObj.toLocaleDateString()}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: "0.65rem", color: "#999" }}>
                                                            {dateObj.toLocaleTimeString([], {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell sx={{ px: 1, py: 1.5 }}>
                                                        <Typography
                                                            sx={{
                                                                fontSize: "0.75rem",
                                                                fontWeight: 700,
                                                                color: item.action === "BUY" ? "#2e7d32" : "#d32f2f",
                                                            }}
                                                        >
                                                            {item.action} {item.instrument} {item.call_type?.toUpperCase()}
                                                        </Typography>

                                                        <Typography sx={{ fontSize: "0.65rem", color: "#333", fontWeight: 600 }}>
                                                            {item.name} • {item.trade_type}
                                                        </Typography>

                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                fontSize: "0.65rem",
                                                                color: "#999",
                                                                mt: 0.5,
                                                                display: "block",
                                                            }}
                                                        >
                                                            @{item.entry?.ideal} | TP {item.targets?.join(", ")} | SL {item.stop_losses?.[0]}
                                                        </Typography>
                                                    </TableCell>

                                                    {/* <TableCell sx={{ px: 1, py: 1.5 }}>
                                                        <Typography sx={{ fontSize: "0.7rem", color: "#333", fontWeight: 600 }}>
                                                            {getResearcherName(item)}
                                                        </Typography>
                                                    </TableCell> */}

                                                    <TableCell align="right" sx={{ px: 1, py: 1.5 }}>
                                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                                            <Button
                                                                size="small"
                                                                onClick={() => onModify(item)}
                                                                sx={{
                                                                    fontSize: "0.6rem",
                                                                    textTransform: "none",
                                                                    color: "#757575",
                                                                    minWidth: "auto",
                                                                    p: 0,
                                                                    justifyContent: "flex-end",
                                                                    "&:hover": {
                                                                        backgroundColor: "transparent",
                                                                        textDecoration: "underline",
                                                                    },
                                                                }}
                                                            >
                                                                Modify/Errata
                                                            </Button>

                                                            <Button
                                                                size="small"
                                                                onClick={() => onExit(item.id)}
                                                                sx={{
                                                                    fontSize: "0.65rem",
                                                                    textTransform: "none",
                                                                    color: "#6200ea",
                                                                    fontWeight: 800,
                                                                    minWidth: "auto",
                                                                    p: 0,
                                                                    justifyContent: "flex-end",
                                                                    "&:hover": {
                                                                        backgroundColor: "transparent",
                                                                        color: "#4500a0",
                                                                    },
                                                                }}
                                                            >
                                                                Exit
                                                            </Button>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 4, color: "#999", fontSize: "0.8rem" }}>
                                                No active recommendations.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>

                {/* ================= WATCHLIST ================= */}
                <Paper
                    sx={{
                        p: { xs: 1, sm: 2 },
                        overflow: { xs: "visible", sm: "hidden" },
                        borderRadius: 2,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mb: 2,
                        }}
                    >
                        <Typography fontWeight={700} sx={{ fontSize: "0.9rem" }}>
                            Watchlist
                        </Typography>

                        <Box
                            sx={{
                                backgroundColor: "#f0f2f5",
                                color: "#000",
                                borderRadius: "6px",
                                px: 1.5,
                                py: 0.2,
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                border: "1px solid #e0e0e0",
                            }}
                        >
                            {watchlistRecommendations.length}
                        </Box>
                    </Box>

                    <TableContainer
                        sx={{
                            maxHeight: 400,
                            width: "100%",
                            minWidth: 0,
                            overflowX: "auto",
                            WebkitOverflowScrolling: "touch",
                        }}
                    >
                        <Table size="small" stickyHeader sx={{ minWidth: { xs: 420, sm: "auto" } }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontSize: "0.65rem", color: "#999", fontWeight: 700, px: 1, backgroundColor: "#fff" }}>
                                        Published Date
                                    </TableCell>
                                    <TableCell sx={{ fontSize: "0.65rem", color: "#999", fontWeight: 700, px: 1, backgroundColor: "#fff" }}>
                                        Recommendation
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontSize: "0.65rem", color: "#999", fontWeight: 700, px: 1, backgroundColor: "#fff" }}>
                                        Action
                                    </TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {watchlistRecommendations.length > 0 ? (
                                    watchlistRecommendations.map((item) => {
                                        const dateObj = new Date(item.created_at);

                                        return (
                                            <TableRow
                                                key={item.id}
                                                sx={{
                                                    "&:last-child td, &:last-child th": { border: 0 },
                                                    "&:hover": { backgroundColor: "#fcfcfc" },
                                                }}
                                            >
                                                <TableCell sx={{ px: 1, py: 1.5 }}>
                                                    <Typography sx={{ fontSize: "0.65rem", color: "#666", fontWeight: 500 }}>
                                                        {dateObj.toLocaleDateString()}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: "0.65rem", color: "#999" }}>
                                                        {dateObj.toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell sx={{ px: 1, py: 1.5 }}>
                                                    <Typography
                                                        sx={{
                                                            fontSize: "0.75rem",
                                                            fontWeight: 700,
                                                            color: item.action === "BUY" ? "#2e7d32" : "#d32f2f",
                                                        }}
                                                    >
                                                        {item.action} {item.instrument} {item.call_type?.toUpperCase()}
                                                    </Typography>

                                                    <Typography sx={{ fontSize: "0.65rem", color: "#333", fontWeight: 600 }}>
                                                        {item.name} • {item.trade_type}
                                                    </Typography>

                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            fontSize: "0.65rem",
                                                            color: "#999",
                                                            mt: 0.5,
                                                            display: "block",
                                                        }}
                                                    >
                                                        @{item.entry?.ideal} | TP {item.targets?.join(", ")} | SL {item.stop_losses?.[0]}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell align="right" sx={{ px: 1, py: 1.5 }}>
                                                    <Button
                                                        size="small"
                                                        onClick={() => onInitiate(item)}
                                                        sx={{
                                                            fontSize: "0.65rem",
                                                            textTransform: "none",
                                                            color: "#1976d2",
                                                            fontWeight: 700,
                                                            minWidth: "auto",
                                                            p: 0,
                                                            justifyContent: "flex-end",
                                                            "&:hover": {
                                                                backgroundColor: "transparent",
                                                                color: "#0d47a1",
                                                            },
                                                        }}
                                                    >
                                                        Initiate
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center" sx={{ py: 4, color: "#999", fontSize: "0.8rem" }}>
                                            No watchlist items.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>
        );
    }
);

export default RecommendationsPanel;