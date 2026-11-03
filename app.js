// Library prototype
// Everything is fake data, no real server.

var books = [
  { id: 1, title: "The Hobbit", author: "J.R.R. Tolkien", status: "available" },
  { id: 2, title: "Dune", author: "Frank Herbert", status: "available" },
  { id: 3, title: "Charlotte's Web", author: "E.B. White", status: "out", waitlist: 2 },
  { id: 4, title: "Hatchet", author: "Gary Paulsen", status: "out", waitlist: 0 },
  { id: 5, title: "Pride and Prejudice", author: "Jane Austen", status: "mine", due: "Nov 20" },
  { id: 6, title: "Dune Messiah", author: "Frank Herbert", status: "out", waitlist: 3 },
  { id: 7, title: "Children of Dune", author: "Frank Herbert", status: "available" },
  { id: 8, title: "The Fellowship of the Ring", author: "J.R.R. Tolkien", status: "available" },
  { id: 9, title: "The Two Towers", author: "J.R.R. Tolkien", status: "out", waitlist: 1 },
  { id: 10, title: "The Return of the King", author: "J.R.R. Tolkien", status: "available" },
  { id: 11, title: "Frankenstein", author: "Mary Shelley", status: "available" },
  { id: 12, title: "A Game of Thrones", author: "George R.R. Martin", status: "out", waitlist: 4 },
  { id: 13, title: "Little Women", author: "Louisa May Alcott", status: "available" },
  { id: 14, title: "The Bell Jar", author: "Sylvia Plath", status: "out", waitlist: 0 },
  { id: 15, title: "Dracula", author: "Bram Stoker", status: "mine", due: "Nov 24" },
  { id: 16, title: "The Odyssey", author: "Homer", status: "available" },
  { id: 17, title: "The Iliad", author: "Homer", status: "out", waitlist: 2 },
  { id: 18, title: "Piranesi", author: "Susanna Clarke", status: "available" },
  { id: 19, title: "The Secret History", author: "Donna Tartt", status: "out", waitlist: 5 }
];

var chosenBook = null;   // the book the user clicked
var chosenAction = "";   // "checkout" or "waitlist"
var busy = false;        // true while waiting, stops double clicks

// grab elements
function $(id) { return document.getElementById(id); }

// say something to screen readers
function announce(msg) {
  $("status").textContent = "";
  setTimeout(function () { $("status").textContent = msg; }, 50);
}

// show one step, hide the others, move focus to its heading
function showStep(num) {
  var ids = ["find", "confirm", "done"];
  for (var i = 0; i < ids.length; i++) {
    $(ids[i]).hidden = (i + 1 !== num);
    if (i + 1 === num) { $("nav" + (i + 1)).setAttribute("aria-current", "step"); }
    else { $("nav" + (i + 1)).removeAttribute("aria-current"); }
  }
  var heading = $(ids[num - 1]).querySelector("h2");
  heading.focus();
  announce(heading.textContent);
}

// loading state for a button
function setLoading(btn, isLoading, text) {
  busy = isLoading;
  btn.classList.toggle("loading", isLoading);
  btn.setAttribute("aria-busy", isLoading);
  btn.querySelector(".label").textContent = text;
}

// ---------- STEP 1: search ----------

$("search-form").addEventListener("submit", function (e) {
  e.preventDefault();
  if (busy) { return; }

  var text = $("q").value.trim().toLowerCase();
  if (text === "") {
    $("q").setAttribute("aria-invalid", "true");
    $("q-err").textContent = "Type a title or author to search, for example Dune.";
    $("q").focus();
    return;
  }
  $("q").removeAttribute("aria-invalid");
  $("q-err").textContent = "";

  // fake 1 second wait
  setLoading($("search-btn"), true, "Searching...");
  $("results-box").hidden = true;
  $("skeleton").hidden = false;
  announce("Searching the catalog.");

  setTimeout(function () {
    var found = [];
    for (var i = 0; i < books.length; i++) {
      var b = books[i];
      var match = b.title.toLowerCase().indexOf(text) >= 0 || b.author.toLowerCase().indexOf(text) >= 0;
      if (match && ($("filter").value === "all" || b.status === "available")) { found.push(b); }
    }
    showResults(found);
    setLoading($("search-btn"), false, "Search");
    $("skeleton").hidden = true;
  }, 1000);
});

$("q").addEventListener("input", function () {
  if ($("q").value.trim() !== "") {
    $("q").removeAttribute("aria-invalid");
    $("q-err").textContent = "";
  }
});

function showResults(found) {
  var list = $("results");
  list.innerHTML = "";
  $("results-box").hidden = false;

  if (found.length === 0) {
    list.innerHTML = "<li>No books found. Check the spelling or choose \"All books\".</li>";
    announce("No books found.");
    return;
  }

  for (var i = 0; i < found.length; i++) {
    var b = found[i];
    var statusText, buttonText;
    if (b.status === "available") { statusText = '<span class="badge ok">Available</span>'; buttonText = "Check out"; }
    else if (b.status === "out") { statusText = '<span class="badge out">Checked out, ' + b.waitlist + ' on waitlist</span>'; buttonText = "Join waitlist"; }
    else { statusText = '<span class="badge out">You have this book, due ' + b.due + '</span>'; buttonText = "Renew"; }

    var li = document.createElement("li");
    li.innerHTML = "<h4>" + b.title + "</h4><div>" + b.author + "</div>" + statusText + "<br>" +
      '<button type="button" class="btn secondary" data-id="' + b.id + '" aria-label="' + buttonText + ": " + b.title + '">' + buttonText + "</button>";
    list.appendChild(li);
  }
  announce(found.length + " books found.");
  $("results-h").focus();
}

// one click handler for all the result buttons
$("results").addEventListener("click", function (e) {
  var btn = e.target.closest("button");
  if (!btn || busy || btn.getAttribute("aria-disabled") === "true") { return; }

  for (var i = 0; i < books.length; i++) {
    if (books[i].id == btn.getAttribute("data-id")) { chosenBook = books[i]; }
  }

  if (chosenBook.status === "mine") { renew(btn); return; }

  chosenAction = (chosenBook.status === "available") ? "checkout" : "waitlist";
  $("h-confirm").textContent = (chosenAction === "checkout") ? "Confirm checkout" : "Confirm waitlist spot";
  $("confirm-text").textContent = (chosenAction === "checkout")
    ? "You are checking out " + chosenBook.title + " by " + chosenBook.author + ". It will be due in 14 days."
    : "You are joining the waitlist for " + chosenBook.title + ". You will be number " + (chosenBook.waitlist + 1) + " in line.";
  $("confirm-btn").querySelector(".label").textContent = (chosenAction === "checkout") ? "Confirm checkout" : "Join waitlist";
  showStep(2);
});

// renew happens right in the list (keeps things simple)
function renew(btn) {
  btn.classList.add("loading");
  btn.textContent = "Renewing...";
  btn.setAttribute("aria-label", "Renewing: " + chosenBook.title);
  btn.setAttribute("aria-busy", "true");
  busy = true;
  announce("Renewing " + chosenBook.title + ". Please wait.");
  setTimeout(function () {
    busy = false;
    chosenBook.due = "Dec 4";
    btn.classList.remove("loading");
    btn.setAttribute("aria-busy", "false");
    btn.textContent = "Renewed";
    btn.setAttribute("aria-label", "Renewed: " + chosenBook.title);
    btn.setAttribute("aria-disabled", "true");
    btn.parentElement.querySelector(".badge").textContent = "Renewed! New due date: Dec 4";
    announce(chosenBook.title + " renewed. New due date is December 4.");
  }, 1200);
}

// ---------- STEP 2: confirm ----------

// collapsible rules
$("rules-btn").addEventListener("click", function () {
  var open = $("rules-btn").getAttribute("aria-expanded") === "true";
  $("rules-btn").setAttribute("aria-expanded", !open);
  $("rules").hidden = open;
});

// button is "disabled" until the box is checked
$("agree").addEventListener("change", function () {
  if ($("agree").checked) {
    $("confirm-btn").removeAttribute("aria-disabled");
    $("confirm-help").textContent = "You can confirm now.";
  } else {
    $("confirm-btn").setAttribute("aria-disabled", "true");
    $("confirm-help").textContent = "The confirm button is unavailable until you agree to the rules.";
  }
});

$("card").addEventListener("input", function () {
  $("card").value = $("card").value.replace(/\D/g, "");  // numbers only
  if (/^\d{6}$/.test($("card").value)) {
    $("card").removeAttribute("aria-invalid");
    $("card-err").textContent = "";
  }
});

$("back-btn").addEventListener("click", function () {
  if (busy) { return; }
  showStep(1);
});

$("confirm-form").addEventListener("submit", function (e) {
  e.preventDefault();
  if (busy) { return; }   // ignore double clicks

  // disabled button: explain instead of doing nothing
  if ($("confirm-btn").getAttribute("aria-disabled") === "true") {
    announce("Confirm is unavailable. Check the box to agree to the rules first.");
    $("agree").focus();
    return;
  }

  $("confirm-error").hidden = true;
  if (!/^\d{6}$/.test($("card").value)) {
    $("card").setAttribute("aria-invalid", "true");
    $("card-err").textContent = "Enter your 6-digit library card number, numbers only.";
    $("card").focus();
    return;
  }

  setLoading($("confirm-btn"), true, "Working...");
  $("confirm-btn").setAttribute("aria-disabled", "true");
  announce("Working on your request. Please wait.");

  // fake 1.5 second wait
  setTimeout(function () {
    setLoading($("confirm-btn"), false, chosenAction === "checkout" ? "Confirm checkout" : "Join waitlist");
    $("confirm-btn").removeAttribute("aria-disabled");

    var problem = "";
    if ($("card").value === "000000") { problem = "$4.50 in fines owed. Please pay at the front desk, then try again."; }
    if ($("card").value === "111111") { problem = "This library card has expired. Please renew it at the front desk."; }
    if ($("card").value === "222222") { problem = "You have too many items checked out (limit is 10). Return an item, then try again."; }
    if (problem !== "") {
      $("confirm-error").hidden = false;
      $("confirm-error").textContent = problem;
      $("confirm-error").focus();
      return;
    }

    if (chosenAction === "checkout") {
      $("done-text").textContent = chosenBook.title + " is checked out. Please return it by " + "Nov 16" + ".";
      chosenBook.status = "mine";
      chosenBook.due = "Nov 16";
    } else {
      $("done-text").textContent = "You are on the waitlist for " + chosenBook.title + ". We will email you when it is ready.";
      chosenBook.waitlist = chosenBook.waitlist + 1;
    }
    showStep(3);
  }, 1500);
});

// ---------- STEP 3 ----------

$("again-btn").addEventListener("click", function () {
  $("agree").checked = false;
  $("agree").dispatchEvent(new Event("change"));
  $("card").value = "";
  $("results-box").hidden = true;
  showStep(1);
  $("q").focus();
});
