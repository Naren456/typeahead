import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./config/db.js";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/suggest", async (req, res) => {
    const q = req.query.q as string;


    if(!q){
        return res.json([]);
    }
    try{
        const suggestion = await prisma.searchQuery.findMany({
            where : {query : {startsWith : q.toLowerCase()}},
            orderBy : {count : 'desc'},
            take : 5 // Prisma uses 'take' instead of 'limit'!
        })
       return res.status(200).json({message : "search suggestions", data : suggestion}); // 200 means OK!
    }
    catch(error){
        return res.status(500).json({error : "failed to fetch suggestion"})
    }
});


app.post("/search", async(req,res)=>{
    const {query} = req.body;
    if(!query){
        return res.status(400).json({error:"Query is required"});
    }
    try{
        const result = await prisma.searchQuery.upsert({
            where : {query : query.toLowerCase()},
            update : {count : {increment : 1}},
            create : {query : query.toLowerCase(),count:1}
        });

        return res.json({message : "Search saved successfully", data: result});
    }
    catch(error){
        console.error("Database error",error);
        return res.status(500).json({error: "Failed to save search query"});
    }
});








// We export the app here instead of listening, so our tests can import it!
export default app;