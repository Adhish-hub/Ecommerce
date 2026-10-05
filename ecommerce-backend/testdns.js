// testdns.js
const dns = require("dns");

dns.resolveSrv("_mongodb._tcp.cluster0.caioygk.mongodb.net", (err, records) => {
  console.log(err || records);
});
