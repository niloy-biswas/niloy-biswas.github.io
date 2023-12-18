const API_URL = "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fmedium.com%2Ffeed%2F%40niloy.swe";


const getClassicPost = (postData) => {
  let template = 
  `
    <div id="post-container">
      <div id="post-header">
        <div id="post-author-image">
          <img src="${postData.authorImage}" alt="${postData.authorName}"/>
        </div>
        <div id="post-author-info">
          <div id="post-author">
            ${postData.authorName}
          </div>
          <div id="post-date">
            ${formatDate(postData.postDate)}
          </div>
        </div>
      </div>
      <img id="post-image" src="${postData.postImage}" alt="${postData.postTitle}"/>
      <div id="post-title">
        ${postData.postTitle}
      </div>
      <div id="post-content">
        ${trimContent(postData.postDescription)}...
        <p id="post-link">
          <a href="${postData.postLink}" target="_blank"> Continue reading... </a>
        </p>
      </div>
    </div>
  `
  return template;
}

const getCompactPost = (postData) => {
  let template = 
  `
    <div id="post-container">
      <div id="post-header">
        <div id="post-author-image">
          <img src="${postData.authorImage}" alt="${postData.authorName}"/>
        </div>
        <div id="post-author-info">
          <div id="post-author">
            ${postData.authorName}
          </div>
          <div id="post-date">
            ${formatDate(postData.postDate)}
          </div>
        </div>
      </div>
      <div id="post-title">
        ${postData.postTitle}
      </div>
      <div id="post-content">
        ${trimContent(postData.postDescription)}...
        <p id="post-link">
          <a href="${postData.postLink}" target="_blank"> Continue reading... </a>
        </p>
      </div>
    </div>
  `
  return template;
}

const getMiniPost = (postData) => {
  let template = 
  `
    <div id="post-container" class="mini">
    <a id="post-link" class="mini" href="${postData.postLink}">
      <div id="post-title" class="mini">
      <span>
        ${postData.postTitle}
      </span>
      </div>
      <img id="post-image" class="mini" src="${postData.postImage}" alt="${postData.postTitle}"/>
    </a>
    </div>
  `
  return template;
}

const formatDate = (date) => {
  // Date formatting options
  var options = {year: 'numeric', month: 'long', day: 'numeric' };
  var dateFormatted = new Date(date);
  // Format: monthname daynumber, year
  dateFormatted = dateFormatted.toLocaleDateString('en', options);
  dateFormatted = dateFormatted.toString();
  return dateFormatted;
}

const trimContent = (content) => {
	// removes images from content
	let plainText = content.replace(/<img[^>]*>/g, "");
	// max content length
	let maxLength = 400
	let trimmedString = plainText.substr(0, maxLength);
	trimmedString = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(" ")))
	return trimmedString;
}

const displayPosts = (data) => {
	let postsArray = data.items;
	let postsContainer = document.getElementById("posts");
  let postTemplate = postsContainer.getAttribute("data-template");
	postsArray.map((post) => {
    // creating a custom data object for future flexibility.
    // this way, if the rss data changes,
    // I just need to change this object values
    // instead of changing the post templates.

      // Parse the HTML content of the post description
    let parser = new DOMParser();
    let doc = parser.parseFromString(post.description, 'text/html');
    let firstImage = doc.querySelector('img'); // Selects the first <img> element
    let firstImageUrl = firstImage ? firstImage.src : ''; // Gets the 'src' of the image, or an empty string if not found
  

    let postData = {
      authorImage : data.feed.image,
      authorName : post.author,
      postDate : post.pubDate,
      postImage : firstImageUrl, // Use the first image URL from the description because thumbnail is not returning any image
      // postImage : post.thumbnail,
      postTitle : post.title,
      postDescription : post.description,
      postLink : post.link,
    }
    console.log(postData);
    
    // rendering different templates for each
    // "data-template" chosen.
    let HTMLPost = '';
    switch(postTemplate){
      case "classic":
        HTMLPost = getClassicPost(postData)
        break;
      case "compact":
        HTMLPost = getCompactPost(postData)
        break;
      case "mini":
        HTMLPost = getMiniPost(postData)
        break;
      default:
        HTMLPost = getClassicPost(postData)
    }
    // appending current post in container
    postsContainer.innerHTML += HTMLPost;
	})
}

fetch(API_URL)
	.then(response => {
		if(!response.ok) {
			throw new Error('Network response was not ok');
		}
		return	response.json()
	})
	.then(data => {
		displayPosts(data);
	})
	.catch(error => {
		console.error('There has been a problem fetching the info: ', error);
		alert('There has been a problem fetching the info.')
	})
