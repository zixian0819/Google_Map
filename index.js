const express = require('express');
const path = require('path');
const { Client } = require('@googlemaps/google-maps-services-js');
var { graphqlHTTP } = require('express-graphql');
var { buildSchema } = require('graphql');

const app = express();
const key = 'AIzaSyBTbivWepc_7wzbn2_riP975kDvM3WYi5U';
const port = process.env.port || 3100;
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const schema = buildSchema(`
  type AreaList {
    place_id: String!,
    title: String!,
  }
  type Query {
    hello: String,
    search(q: String): [AreaList],
  }
`);

const root = {
  hello: () => 'Hello world!',
  search: ({ q }, root) => {
    // console.log(q);
    const client = new Client({});
    return client
      .placeAutocomplete({ params: { key, input: q, components: 'country:us' } })
      .then((e) => {
        const data = e.data.predictions.map((row) => {
          row.title = row.structured_formatting.main_text;
          return row;
        });
        // res.json(data);
        return data;
      })
      .catch((ex) => {
        // res.json({ msg: ex.data });
        return null;
      });

    // return [{ place_id: 'asdfa', title: 'asfda' }]; // 'Hello world!';
    // return { place_id: 'asdfa', title: 'asfda' }; // 'Hello world!';
  },
};

app
  .use(async (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization,token,admin_token,restaurant_token, Accept, X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    if (req.method == 'OPTIONS') {
      res.send(200);
      return;
    }
    next();
  })
  .use('/graphql', graphqlHTTP({ schema: schema, rootValue: root, graphiql: true }))
  .get('/api', async (req, res) => {
    try {
      const { q = '' } = req.query;
      if (!q) {
        res.json([]);
        return;
      }
      const client = new Client({});
      client
        .placeAutocomplete({ params: { key, input: q, components: 'country:us' } })
        .then((e) => {
          const data = e.data.predictions.map((row) => {
            row.title = row.structured_formatting.main_text;
            return row;
          });
          res.json(data);
        })
        .catch((ex) => {
          res.json({ msg: ex.data });
        });
    } catch (ex) {
      res.json({ msg: ex.message });
    }
  });
app.listen(port, () => {
  console.log(`http://127.0.0.1:${port}/`);
});
