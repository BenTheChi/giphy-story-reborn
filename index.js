// DOM Element Selectors
const domElements = {
  storyBody: document.getElementById("storyBody"),
  storyTitle: document.getElementById("storyTitle"),
  storyGif: document.getElementById("giphy-embed"),
  prevBtn: document.getElementById("left-button"),
  nextBtn: document.getElementById("right-button"),
  textArea: document.getElementById("text-area"),
  submitButton: document.getElementById("submit-button"),
  saveButton: document.getElementById("save-button"),
  storyList: document.getElementById("story-list"),
};

// Application State Management
const state = {
  slides: [],
  title: "",
  counter: 0,
  stories: [],
};

// Initial Setup and Configuration
function initializeApp() {
  // Hide buttons that aren't needed initially
  domElements.prevBtn.style.display = "none";
  domElements.nextBtn.style.display = "none";
  domElements.saveButton.style.display = "none";

  // Load existing stories from local storage
  const savedStories = localStorage.getItem("stories");
  if (savedStories) {
    state.stories = JSON.parse(savedStories);
    renderSavedStories();
  }

  // Add Event Listeners
  addEventListeners();
}

// Text Parsing Utility
function parser(body) {
  // Replace punctuation with delimiters for easier parsing
  body = body
    .replace(/\(/g, ".(")
    .replace(/\)/g, ").")
    .replace(/\n/g, ".")
    .replace(/\!/g, "!.")
    .replace(/\?/g, "?.");

  let sections = body.split(/[.,]/);

  // Complex parsing logic to handle capitalized sections
  for (let i = 0; i < sections.length; i++) {
    let section = sections[i].trim();

    // Skip empty or all-uppercase sections
    if (section.length < 1 || section.toUpperCase() === section) continue;

    let subSections = section.split(" ");
    let newSection = "";
    let changes = 0;

    for (let x = 0; x < subSections.length; x++) {
      let subSection = subSections[x];

      // Special handling for capitalized words
      if (
        subSection.toUpperCase() === subSection &&
        subSection !== "I" &&
        subSection !== "A"
      ) {
        if (newSection !== "") {
          sections.splice(i + changes, 0, newSection);
          changes++;
          sections.splice(i + changes, 0, subSection);
          changes++;
          newSection = "";
        } else {
          sections.splice(i, 0, subSection);
          changes++;
        }
      } else {
        newSection += subSection + " ";
      }
    }

    if (changes !== 0) {
      i += changes;
      sections.splice(i, 1, newSection.trim());
    }
  }

  return sections;
}

// Async GIF Fetching
async function buildSlides(sections) {
  const API_KEY = "G5mb3AgMEZjKJQoTTsZWoAbC841cxpzw";
  const FALLBACK_GIF = "https://giphy.com/embed/3o7aTskHEUdgCQAXde";

  const promises = sections.map(async (section) => {
    if (section.trim() === "") return null;

    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?q=${section
          .split(" ")
          .join("+")}&api_key=${API_KEY}&limit=1`
      );
      const data = await response.json();

      return {
        keywords: section.trim(),
        embed_url: data.data.length > 0 ? data.data[0].embed_url : FALLBACK_GIF,
      };
    } catch (error) {
      console.error("GIF fetch error:", error);
      return {
        keywords: section,
        embed_url: FALLBACK_GIF,
      };
    }
  });

  return (await Promise.all(promises)).filter((slide) => slide !== null);
}

// Navigation and Story Management
function resetStory() {
  domElements.saveButton.style.display = "none";
  domElements.prevBtn.style.display = "none";
  domElements.nextBtn.style.display = "block";
  domElements.textArea.textContent = state.title;
  domElements.textArea.style.display = "block";
}

function loadStory(id) {
  const story = state.stories.find((s) => s.id === id);
  state.title = story.title;
  state.slides = story.body;
  state.counter = 0;

  domElements.storyGif.setAttribute(
    "src",
    state.slides[state.counter].embed_url
  );
  resetStory();
}

function deleteStory(id) {
  state.stories = state.stories.filter((s) => s.id !== id);
  localStorage.setItem("stories", JSON.stringify(state.stories));
  renderSavedStories();
}

function renderSavedStories() {
  domElements.storyList.innerHTML = "";

  state.stories.forEach((story) => {
    const li = document.createElement("li");
    li.innerHTML = `
            ${story.title} 
            <button id="load-btn" onclick="loadStory(${story.id})">Load</button>
            <button id="delete-btn" onclick="deleteStory(${story.id})">Delete</button>
        `;
    domElements.storyList.appendChild(li);
  });
}

function saveStory(story) {
  // Add timestamp to make each story unique
  story.id = Date.now();
  state.stories.push(story);
  localStorage.setItem("stories", JSON.stringify(state.stories));

  renderSavedStories();
}

// Event Listeners Setup
function addEventListeners() {
  // Previous Button Navigation
  domElements.prevBtn.addEventListener("click", (event) => {
    domElements.nextBtn.style.display = "inline";
    domElements.textArea.style.display = "block";
    domElements.saveButton.style.display = "none";

    if (state.counter > 0) {
      state.counter--;
      domElements.storyGif.setAttribute(
        "src",
        state.slides[state.counter].embed_url
      );
      domElements.textArea.textContent = state.slides[state.counter].keywords;

      if (state.counter === 0) {
        domElements.prevBtn.style.display = "none";
      }
    }
  });

  // Next Button Navigation
  domElements.nextBtn.addEventListener("click", (event) => {
    domElements.prevBtn.style.display = "inline";

    if (state.counter < state.slides.length - 1) {
      state.counter++;
      domElements.storyGif.setAttribute(
        "src",
        state.slides[state.counter].embed_url
      );
      domElements.textArea.textContent = state.slides[state.counter].keywords;

      if (state.counter === state.slides.length - 1) {
        domElements.nextBtn.style.display = "none";
        domElements.textArea.style.display = "none";
        domElements.saveButton.style.display = "block";
      }
    }
  });

  // Submit Story Button
  domElements.submitButton.addEventListener("click", async (event) => {
    state.title = domElements.storyTitle.value;

    try {
      const finalStory = await buildSlides(parser(domElements.storyBody.value));
      state.counter = 0;
      state.slides = finalStory;

      // Add title slide
      state.slides.unshift({
        keywords: state.title,
        embed_url: "https://giphy.com/embed/UkIWEk14H2Fe4gxF54",
      });

      // Add end slide
      state.slides.push({
        keywords: "Save",
        embed_url: "https://giphy.com/embed/l4FAPaGGeB7D1LfIA",
      });

      domElements.saveButton.style.display = "none";
      domElements.prevBtn.style.display = "none";
      domElements.nextBtn.style.display = "block";
      domElements.textArea.textContent = state.title;
      domElements.textArea.style.display = "block";

      domElements.storyGif.setAttribute(
        "src",
        state.slides[state.counter].embed_url
      );
    } catch (error) {
      console.error("Story creation error:", error);
    }
  });

  // Save Story Button
  domElements.saveButton.addEventListener("click", () => {
    const story = {
      title: state.title,
      body: state.slides,
    };

    saveStory(story);
    alert("Story saved!");
  });
}

// Initialize the application when the script loads
initializeApp();
