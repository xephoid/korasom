require('dotenv').config();
const port = process.env.PORT || 8080;
const app = require('express')();

app.use(require('./api'));

const server = app.listen(port, () => console.log('App running on port', port))
