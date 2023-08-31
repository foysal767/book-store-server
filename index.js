const express = require("express");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mxrfp9v.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    const db = client.db("book-store");
    const bookCollection = db.collection("books");

    app.get("/recent-book", async (req, res) => {
      const cursor = bookCollection.find({}).sort({ _id: -1 });
      const result = await cursor.limit(10).toArray();
      res.send({ status: true, data: result });
    });

    app.get("/all-books", async (req, res) => {
      const cursor = bookCollection.find({});
      const books = await cursor.toArray();
      res.send({ status: true, data: books });
    });

    app.post("/book", async (req, res) => {
      const book = req.body;
      const result = await bookCollection.insertOne(book);
      res.send(result);
    });

    app.patch("/book/:id", async (req, res) => {
      const id = req.params.id;
      const book = req.body;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          title: book?.title,
          author: book?.author,
          genre: book?.genre,
          publication: book?.publication,
          img: book?.img,
        },
      };
      const result = await bookCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    app.get("/book/:id", async (req, res) => {
      const id = req.params.id;
      const result = await bookCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.delete("/book/:id", async (req, res) => {
      const id = req.params.id;

      const result = await bookCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.post("/comment/:id", async (req, res) => {
      const bookId = req.params.id;
      const comment = req.body.comment;

      const result = await bookCollection.updateOne(
        { _id: new ObjectId(bookId) },
        { $push: { comment: comment } }
      );

      if (result.modifiedCount !== 1) {
        console.error("Book not found or comment not added");
        res.json({ error: "Book not found or comment not added" });
        return;
      }

      console.log("Comment added successfully");
      res.json({ message: "Comment added successfully" });
    });

    app.get("/comment/:id", async (req, res) => {
      const bookId = req.params.id;

      const result = await bookCollection.findOne(
        { _id: new ObjectId(bookId) },
        { projection: { _id: 0, comment: 1 } }
      );
      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ error: "Book not found" });
      }
    });
  } finally {
  }
};
run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Welcome to Book-store");
});

app.listen(port, () => {
  console.log(`Book store app listening on port ${port}`);
});
