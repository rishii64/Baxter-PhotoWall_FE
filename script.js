const isPostPage = document.getElementById("postForm") !== null;
const isWallPage = document.getElementById("postWall") !== null;
const totalComments = document.getElementById("totalComments");

// SECTION 1: POST PAGE
if (isPostPage) {
  const postForm = document.getElementById("postForm");
  const nameInput = document.getElementById('name');
  const imageInput = document.getElementById("imageInput");
  const imagePreview = document.getElementById("imagePreview");
  const commentInput = document.getElementById("commentInput");
  const fileNameSpan = document.getElementById("fileName");

  const profileInput = document.getElementById("profileInput");
  const profilePreview = document.getElementById("profilePreview");
  const profileIcon = document.getElementById("profileIcon");
  const profileFileName = document.getElementById("profileFileName");
  const employeeId = document.getElementById("empID");
  const photoTitle = document.getElementById("photoTitle");

  let profileImageData = null;

  // profile-image upload
  profileInput.addEventListener("change", () => {
    const file = profileInput.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid profile image.");
      profileInput.value = "";
      return;
    }

    if (profileFileName) profileFileName.textContent = file.name;

    const reader = new FileReader();

    reader.onload = (e) => {
      profileImageData = e.target.result;

      // Replace icon with image
      profilePreview.innerHTML = `<img src="${profileImageData}" class="w-full h-full object-fit rounded-xl" />`;
    };

    reader.readAsDataURL(file);
  });

  // Image Selection & Preview
  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];

    if (file) {
      // Update file name text if the element exists
      if (fileNameSpan) fileNameSpan.textContent = file.name;

      if (!file.type.startsWith("image/")) {
        alert("Please upload a valid image file.");
        imageInput.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreview.classList.remove("hidden");
      };
      reader.readAsDataURL(file);
    } else {
      imagePreview.src = "";
      imagePreview.classList.add("hidden");
      if (fileNameSpan) fileNameSpan.textContent = "No file chosen";
    }
  });

  // 2. Handle Form Submission
  postForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const empID = employeeId.value.trim();
    const phTitle = photoTitle.value.trim();
    const comment = commentInput.value.trim();
    const file = imageInput.files[0];

    if (!file) {
      alert("Please upload an image.");
      return;
    }

    const reader = new FileReader();

    reader.onload = async () => {
      const newPost = {
        id: Date.now(),
        image: reader.result,
        profileImage: profileImageData,
        name: name || "Anonymous",
        empID: empID || "",
        phTitle: phTitle || "",
        comment: comment || "No comment provided.",
        date: new Date().toLocaleString()
      };

      const saved = await savePost(newPost);
      if (!saved) {
        alert("There was a problem saving your post. Please try again.");
        return;
      }

      postForm.reset();
      imagePreview.classList.add("hidden");
      alert("Post uploaded successfully!");

      // window.location.href = "wall.html";
    };

    reader.readAsDataURL(file);
  });
}

// SECTION 2: WALL PAGE
if (isWallPage) {
  const postWall = document.getElementById("postWall");

  // const posts = getPosts();

  (async () => {
    const posts = await getPosts();

    if (!posts || posts.length === 0) {
      postWall.innerHTML = `<p class="text-center text-gray-400 mt-10">No posts yet.</p>`;
    } else {
      postWall.innerHTML = "";
      posts.forEach(post => renderPost(post, postWall));
      // [...posts].reverse().forEach(post => renderPost(post, postWall));
    }

    if (totalComments) {
      totalComments.innerText = posts.length;
    }
  })();

  // if (posts.length === 0) {
  //   postWall.innerHTML = `
  //       <p class="text-center text-gray-400 mt-10">
  //         No posts yet.
  //       </p>`;
  // } else {
  //   posts.reverse().forEach((post) => renderPost(post, postWall));
  // }

  // Total Posts
  totalComments.innerText = posts.length
}

// SECTION 3: STORAGE FUNCTIONS
// ----------- Locally saving on browser ----------
// function savePost(post) {
//   const posts = getPosts();
//   posts.push(post);
//   localStorage.setItem("baxterPosts", JSON.stringify(posts));
// }

// function getPosts() {
//   return JSON.parse(localStorage.getItem("baxterPosts")) || [];
// }
// ------------------------------------------------
async function savePost(post) {
  try {
    const response = await fetch("http://localhost:5000/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(post)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error saving post:", errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error saving post:", error);
    return false;
  }
}
async function getPosts() {
  try {
    const res = await fetch("http://localhost:5000/api/posts");
    return await res.json();
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

// SECTION 4: RENDER POST
// function renderPost(post, container) {
//   const postCard = document.createElement("div");

//   postCard.className = "bg-white border rounded-xl p-4 shadow-sm space-y-3";
//   // const displayDate = post.date ? new Date(post.date).toLocaleString() : "Unknown Date";
//   postCard.innerHTML = `
//         <div class="bg-white rounded-2xl p-5 shadow-sm border flex justify-between items-center gap-4">

//       <div class="flex gap-4 items-start">
//         <div class="w-20 h-20 rounded-full overflow-hidden bg-[#3e6b4f] flex items-center justify-center">
//           ${post.profileImage ? `<img src="${post.profileImage}" class="w-full h-full object-cover" />`
//       : `<i class="fa-solid fa-user text-5xl text-white"></i>`}
//         </div>

//         <div class="max-w-[40%]">
//           <div class="flex items-center gap-4 text-lg">
//             <span class="font-medium text-[#3e6b4f]">${post?.name || "Anonymous"}</span>
//             <span class="text-gray-400">•</span>
//             <span class="text-gray-400 text-xs">${post.date}</span>
//           </div>

//           <p class="text-md text-gray-600 mt-1">
//             ${post.comment}
//           </p>
//         </div>
//       </div>

//       <div class="flex items-center gap-4">
//         <span class="text-[#3e6b4f] text-lg">❤</span>
//         ${post.image ? `<img src="${post.image}" class="w-28 h-24 rounded-lg object-cover"/>` : ''}
//       </div>
//     </div>
//     `;

//   container.appendChild(postCard);
// }
function renderPost(post, container) {
  const postCard = document.createElement("div");
  postCard.className = "mb-4"; // Spacing between cards

  postCard.innerHTML = `
    <div class="bg-white rounded-2xl p-5 shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      
      <!-- User Info & Story Section -->
      <div class="flex gap-4 items-start flex-1">
        <!-- Profile Image -->
        <div class="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-[#3e6b4f] flex-shrink-0 flex items-center justify-center">
          ${post.profileImage 
            ? `<img src="${post.profileImage}" class="w-full h-full object-cover" />`
            : `<i class="fa-solid fa-user text-3xl md:text-5xl text-white"></i>`
          }
        </div>

        <!-- Text Content -->
        <div class="flex-1">
          <div class="flex flex-wrap items-center gap-2 md:gap-4 text-lg">
            <span class="font-bold text-[#3e6b4f]">${post?.name || "Anonymous"}</span>
            <span class="text-gray-400 hidden md:inline">•</span>
            <span class="text-gray-400 text-xs">${post.date}</span>
          </div>
          
          ${post.phTitle ? `<h3 class="font-semibold text-gray-800 mt-1">${post.phTitle}</h3>` : ''}

          <p class="text-sm md:text-md text-justify text-gray-600 mt-2 leading-relaxed">
            ${post.comment}
          </p>
        </div>
      </div>

      <!-- Uploaded Image & Interaction Section -->
      <div class="flex items-center gap-4 self-end md:self-center">
        <button class="text-gray-300 hover:text-red-500 transition-colors text-2xl">
          <i class="fa-solid fa-heart"></i>
        </button>
        
        ${post.image 
          ? `<div class="w-32 h-32 md:w-48 md:h-36 rounded-xl overflow-hidden border shadow-sm">
               <img src="${post.image}" class="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" />
             </div>` 
          : ''}
      </div>
    </div>
  `;

  container.appendChild(postCard);
}