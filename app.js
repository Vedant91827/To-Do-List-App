//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Before Database
// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

//Create a New Database inside MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {useNewUrlParser: true});
//Create a Schema for items
const itemsSchema = {
  name: String
};
//Create a new Mongoose Model based on item Schema
const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];
//This is for list based express route parameter database
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {
  //this will also fetch new existing items saved in database
  Item.find({}, function(err, foundItems){
    //console.log(foundItems);
    //Insert Default items in Collection if there are no items in collection
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully savevd default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
    //This Ensures how many times you hit restart if there are items already present it will not enter them again ,
    //instead it will redirect to same route and render all those items
  });

});

//Create a Dynamic routes : Express dynamic route
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  //To avoid duplicate entries (for example if you try to enter same path same list will be created again)
  //Find one cause its getting one object
  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        //console.log("Doesn't exist!");
        //Create a new list
        //Start of with default list items in this path also
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        //it will not show them so
        res.redirect("/" + customListName);
      } else {
        //Show an existing list

        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

});

app.post("/", function(req, res){
  //user will post / enter this itemName
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
    //console.log(req.body); //But nothing happends cause we do not submitted or any button to make a post request to required route
  //Submit a form when checkbox is checked
  // After adding name="checkbox" onchange="this.form.submit()" we will get
  //console.log(req.body);
  //After adding value="<%= item._id %> " we can actually get which item was checked off
  const checkedItemId = req.body.checkbox.trim(); //trim(); //I added trim cause that id has a white spaces so trim will remove that
  const listName = req.body.listName;  //to check in delete section post request

  if (listName === "Today") {  //We are in our default list
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else { //Delete request is coming for a Custom a list
    //Now we have to remove a checkeditem from a array
    // $pull operator removes from an existing srray all instances of a value or values that match a specified condition ,insteaded of seearching from array
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        //When item gets deleted we get redirected to same list again listName in ejs delete post request
        res.redirect("/" + listName);
      }
    });
  }


});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
