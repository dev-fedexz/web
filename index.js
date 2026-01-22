const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'lib')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'lib', 'login.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'lib', 'index.html'));
});

app.get('*', (req, res) => {
  res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
