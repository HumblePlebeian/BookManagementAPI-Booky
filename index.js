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
const booky = express();
booky.use(express.json());
booky.use(bodyParser.urlencoded({extended:true}));
booky.use(bodyParser.json()); //to ensure that no bugs arise when retrieving in JSON format

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
booky.get("/", async (req, res) => {
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
booky.get("/is/:isbn", (req, res) => {
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
booky.get("/category/:category", (response,request) => {
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
booky.get("/lang/:language", (request,response) => {
    const getSpecificBookOnLang = database.books.filter(
        (book) => book.language === request.params.language
    );
    if (getSpecificBookOnLang.length === 0){
        return response.json({error: `No book in language '${request.params.language}' found in the records.`});
    }
    return response.json({books: getSpecificBookOnLang});
});


//POST REQUESTS

/*
POST Request - 1
Route: /book/new
Purpose: Create and add a new book
Method: POST
*/
booky.post("/book/new", (request,response) => {
    const newBook = request.body; 
    database.books.push(newBook);
    return response.json({updatedBooks: database.books});
});

/*
POST Request - 2
Route: /author/new
Purpose: Create and add a new author
Method: POST
*/
booky.post("/author/new", (request,response) => {
    const newAuthor = request.body;
    database.author.push(newAuthor);
    return response.json({updatedAutors: database.author});
});

/*
POST Request - 3
Route: /publication/new
Purpose: Create and add a new publication
Method: POST
*/
booky.post("/publication/new", async(req, res) => {
    const {newPublication} = req.body;
     const addNewPub =PublicationModel.create(newPub);
    return res.json({upadatedPub :addNewPub ,
  message: "A new publication added successfully!"});
});


// PUT(Update) REQUESTS

/* PUT Request-1
Route            /book/update
Description      Update book on isbn
Access           PUBLIC
Parameter        isbn
Methods          PUT
*/

booky.put("/book/update/:isbn",async (req,res) => {
  const updatedBook = await BookModel.findOneAndUpdate(
    {
      ISBN: req.params.isbn
    },
    {
      title: req.body.bookTitle
    },
    {
      new: true
    }
  );

  return res.json({
    books: updatedBook
  });
});


/* PUT Request-2
Route            /book/author/update
Description      Update /add new author
Access           PUBLIC
Parameter        isbn
Methods          PUT
*/

booky.put("/book/author/update/:isbn", async(req,res) =>{
  //Update book database
const updatedBook = await BookModel.findOneAndUpdate(
  {
    ISBN: req.params.isbn
  },
  {
    $addToSet: {
      authors: req.body.newAuthor
    }
  },
  {
    new: true
  }
);

  //Update the author database
  const updatedAuthor = await AuthorModel.findOneAndUpdate(
    {
      id: req.body.newAuthor
    },
    {
      $addToSet: {
        books: req.params.isbn
      }
    },
    {
      new: true
    }
  );

  return res.json(
    {
      bookss: updatedBook,
      authors: updatedAuthor,
      message: "New author was added"
    }
  );
} );



/* PUT Request-3
Route            /publication/update/book
Description      Update /add new publication
Access           PUBLIC
Parameter        isbn
Methods          PUT
*/

booky.put("/publication/update/book/:isbn", (req,res) => {
  //Update the publication database
  database.publication.forEach((pub) => {
    if(pub.id === req.body.pubId) {
      return pub.books.push(req.params.isbn);
    }
  });

  //Update the book database
  database.books.forEach((book) => {
    if(book.ISBN === req.params.isbn) {
      book.publications = req.body.pubId;
      return;
    }
  });

  return res.json(
    {
      books: database.books,
      publications: database.publication,
      message: "Successfully updated publications"
    }
  );
});



//DELETE REQUESTS

/*
DELETE Request
Purpose: Delete a book based on ISBN
*/
booky.delete("/book/delete/:isbn", async(req, res) => {
    const updatedBookDatabase = await BookModel.findOneAndDelete({ISBN: req.params.isbn});
    return res.json({books: updatedBookDatabase});
});


/*
DELETE Request - 2 
Purpose: Delete an author based on authID
*/
booky.delete("/author/delete/:id", async(req, res) => {
    const updatedAuthorDatabase = await AuthorModel.findOneAndDelete({id: req.params.id});
    return res.json({authors: updatedAuthorDatabase});
});

/*
DELETE Request - 3
Purpose: Delete a book based on ISBN & an author based on authID
*/

booky.delete("/book/delete/author/:isbn/:authorId", (req,res) => {
  //Update the book database
   database.books.forEach((book)=>{
     if(book.ISBN === req.params.isbn) {
       const newAuthorList = book.author.filter(
         (eachAuthor) => eachAuthor !== parseInt(req.params.authorId)
       );
       book.author = newAuthorList;
       return;
     }
   });


  //Update the author database
  database.author.forEach((eachAuthor) => {
    if(eachAuthor.id === parseInt(req.params.authorId)) {
      const newBookList = eachAuthor.books.filter(
        (book) => book !== req.params.isbn
      );
      eachAuthor.books = newBookList;
      return;
    }
  });

  return res.json({
    book: database.books,
    author: database.author
  });
});


// Connecting to the server after first receiving a connection confirmation from DB
booky.listen(3000, () => 
    connectToDB().then(() => console.log("The server is running"))
    .catch((error) => console.log(error))
);
