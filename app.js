import express, { response } from "express";

const PORT = 3000;
const app = express();

app.use(express.json());
let users = [
  { id: 1, name: "Abel", age: 19 },
  { id: 2, name: "Bob", age: 20 },
  { id: 3, name: "Cedric", age: 21 },
  { id: 4, name: "Dave", age: 22 },
];

//GET
app.get("/users", (req, res) => {
  res.status(200).json(users);
});

app.get("/users/:id", (req, res) => {
  const userId = +req.params.id;
  const user = users.find((user) => user.id == userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).json(user);
});
//POST
app.post("/users", (req, res) => {
  const name = req.body.name;
  const age = +req.body.age;
  if (!name || !age) {
    return res.status(400).json({ message: "Invalid credentials" });
  }
  const id = users[users.length - 1]?.id + 1 || 1;
  const user = { id, name, age };
  users.push(user);
  res.status(201).json(user);
});
//PUT
app.put("/users/:id", (req, res) => {
  const userId = +req.params.id;
  let user = users.find((user) => user.id == userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const name = req.body.name;
  const age = +req.body.age;
  if (!name || !age) {
    return res.status(400).json({ message: "Invalid credentials" });
  }
  const index = users.indexOf(user);
  user = { ...user, name, age };
  users[index] = user;
  res.status(200).json(user);
});
//DELETE
app.delete("/users/:id", (req, res) => {
  const userId = +req.params.id;
  let user = users.find((user) => user.id == userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  users = users.filter((user) => user.id != userId);
  res.status(200).json({ message: "Successfully deleted!" });
});
//PATCH
app.patch("/users/:id", (req, res) => {
  const userId = +req.params.id;
  let user = users.find((user) => user.id == userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const name = req.body.name;
  const age = +req.body.age;

  const index = users.indexOf(user);
  user = {
    id: user.id,
    name: name || user.name,
    age: age || user.age,
  };

  users[index] = user;
  res.status(200).json(user);
});

app.listen(PORT, () => {
  console.log(`Server runs on port http://localhost:${PORT}`);
});
