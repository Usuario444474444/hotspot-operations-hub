const express = require('express');
const app = express();

app.use(express.json());

app.use(express.static('src/public'));

const tickets = require('./routes/tickets');
const tiendas = require('./routes/tiendas');
const dashboard = require('./routes/dashboard');
const browserTools = require('./routes/browser-tools');
const hotspot = require('./routes/hotspot');

app.use(tickets);
app.use(tiendas);
app.use(dashboard);
app.use(browserTools);
app.use(hotspot);

app.get('/api/test', (req, res) => {
  res.json({
    ok: true,
    version: 'V5'
  });
});

app.listen(3000, () => {
  console.log('HOH-V5 running');
});