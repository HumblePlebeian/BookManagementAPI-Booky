const express = require("express");
const mongoose = require("mongoose");
var bodyParser = require("body-parser");
//database
const database = require("./DataBase/database");

//Models
const BookModel = require("./database/books");
const AuthorModel = require("./database/author");
const publicationModel = require("./database/publication");


//initialise express
const bookie = express();
bookie.use(express.json());
bookie.use(bodyParser.urlencoded({extended:true}));
bookie.use(bodyParser.json()); //to ensure that no bugs arise when retrieving in JSON format

//connecting mongoDB
const connectToDB = async() => mongoose.connect(process.env.MONGO_URL,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
});


/*
API-1 
Route: / (root)
Description: GET all books
Access: Public
Params: None
Methods: GET 
*/
//to check if the connections are working
bookie.get("/", async (req, res) => {
    const getAllBooks = await BookModel.find();
    return res.json(getAllBooks);
});

/*
API-2
Route: /is
Description: GET specific book based on ISBN
Access: Public
Params: isbn
Methods: GET
*/
bookie.get("/is/:isbn", (req, res) => {
    const getSpecificBook = database.books.filter(
        (book) => book.ISBN === req.params.isbn
        )

        if (getSpecificBook.length === 0){
            return res.json({error: `No book found for the ISBN of ${req.params.isbn}`});
        }
        return res.json({book: getSpecificBook});
});



/*
API-3
Route: /category
Description: GET specific book based on category
Access: Public
Params: category
Methods: GET
*/
bookie.get("/category/:category", (response,request) => {
    const getSpecificBookOnCat = database.books.filter(
        (book) => book.category.include(request.params.category)
        );
    if (getSpecificBookOnCat.length === 0){
        return response.json({error: `No book of category ${request.params.category} found.`});
    }   
    return response.json({books: getSpecificBookOnCat});
});

/*
API-4
Route: /lang
Description: GET specific book based on a particular language
Access: Public
Params: language
Methods: GET
*/
bookie.get("/lang/:language", (request,response) => {
    const getSpecificBookOnLang = database.books.filter(
        (book) => book.language === request.params.language
    );
    if (getSpecificBookOnLang.length === 0){
        return response.json({error: `No book in language '${request.params.language}' found in the records.`});
    }
    return response.json({books: getSpecificBookOnLang});
});


/*
POST Request
Route: /book/new
Purpose: Create and add a new book
Method: POST
*/
bookie.post("/book/new", (request,response) => {
    const newBook = request.body; 
    database.books.push(newBook);
    return response.json({updatedBooks: database.books});
});

/*
POST Request
Route: /author/new
Purpose: Create and add a new author
Method: POST
*/

bookie.post("/author/new", (request,response) => {
    const newAuthor = request.body;
    database.author.push(newAuthor);
    return response.json({updatedAutors: database.author});
});


// Connecting to the server after first receiving a connection confirmation from DB
bookie.listen(3000, () => 
    connectToDB().then(() => console.log("The server is running"))
    .catch((error) => console.log(error))
);
