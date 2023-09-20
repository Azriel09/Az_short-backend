const express = require('express')
const serverless = require('serverless-http')
const api = express()
const router = express.Router()
const cors = require('cors');
const bodyParser = require('body-parser')
const mysql = require('mysql2')
api.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
    res.header("Access-Control-Allow-Credentials", true)
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });
  
api.use(cors());
api.use(express.json());
  
//   app.use(bodyParser.json());
api.use(bodyParser.urlencoded({ extended: true }));

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
}

const db = mysql.createConnection(dbConfig)


db.connect((err) => {
    if(err) {
        console.log("Error connecting to MySQL RDS:", err)
        return
    }
    console.log("Connected to MySQL RDS")

    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS test (
      id INT AUTO_INCREMENT PRIMARY KEY,
      link VARCHAR(255) NOT NULL,
      code VARCHAR(255) NOT NULL,
      visited INT NOT NULL
    )
  `;
  db.query(createTableQuery, (err, results) => {
    if (err) {
      console.error('Error creating table:', err);
    } else {
      console.log('Table created successfully');
    }

   
    })

   
})

router.get("/", (req, res) => {
    res.json("Kore ga backend da!")
})

router.post("/submit",(req, res) => {
    const q_insert = "INSERT INTO test (`link`, `code`, `visited`) VALUES (?)"
    const q_find = "SELECT * FROM az_short.test WHERE shortened LIKE (?)"
    let shortened = crypto.randomBytes(2).toString('hex')
    let visited = 1
    let values = [req.body.link, shortened, 1]

    // const randomString = "SELECT SUBSTR(MD5(RAND()), 1, 10) AS randomString"
    
    const link = "https://azshort.netlify.app/"
    db.query(q_insert, [values], (err, data) => {
            
        if (err) {
            res.json(err)
        } else {
            console.log("Link submitted")
            return res.json(link+shortened)
           
        }
    })

})



router.get("/:id", (res, req) => {
    let value = res.params.id
    let long_url = ''
    
    const q_find ="SELECT * FROM az_short.test WHERE code LIKE (?)"
    db.query(q_find,[value],function(err, rows){
        if (err) {
            console.log(err)
            req.redirect("https://az-short.netlify.app/error")
        }
        if (rows[0]){
            
            long_url = rows[0].link;
            req.status(301)
            if (long_url.includes("https://")){
                req.redirect(long_url)
            } else {
                req.redirect("https://"+long_url)
            }
        } else {
            console.log(rows)
            req.redirect("https://az-short.netlify.app/error")
        }
    })
  });

api.use('/.netlify/functions/api/', router);
export const handler = serverless(api);
