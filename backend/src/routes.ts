import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  return res.send("ta funcionando");
});

export default router;
