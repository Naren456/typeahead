import express from "express";

const app = express();

app.use(express.json());

app.get("/suggest", (req, res) => {
    const prefix = 0;

    return res.json({
        message: "suggest api working",
        prefix,
    });
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});