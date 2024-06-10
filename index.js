const express = require("express");
const sequelize = require("./config");
const Url = require("./model/url");
const { v4: uuidv4 } = require("uuid");
const app = express();

app.use(express.json());

sequelize
  .sync()
  .then(() => {
    console.log("Database synchronized");
  })
  .catch((err) => {
    console.error("Error synchronizing database:", err);
  });

function validURL(str) {
  const pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // process.env.PORT and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // fragment locator
  return !!pattern.test(str);
}

app.post("/v1/url/shorten", async (req, res) => {
  const { url } = req.body;

  if (!url || !validURL(url)) {
    return res.status(400).send({ error: "Invalid URL" });
  }

  try {
    const shortUrl = uuidv4().slice(0, 8);
    await Url.create({ originalUrl: url, shortUrl });

    res.send({ shortUrl: shortUrl });
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

app.get("/:shortUrl", async (req, res) => {
  const { shortUrl } = req.params;

  try {
    const url = await Url.findOne({ where: { shortUrl } });

    if (url) {
      res.redirect(url.originalUrl);
    } else {
      res.status(404).send({ error: "URL not found" });
    }
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Backend listenning at http://localhost:${process.env.PORT}`);
});
