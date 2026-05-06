const isPostPage = document.getElementById("postForm") !== null;
const isWallPage = document.getElementById("postWall") !== null;
const totalComments = document.getElementById("totalComments");
// const backend_URI = "https://baxter-pw.vercel.app";

// TOAST NOTIFICATION FUNCTION
function showToast(message, type = 'error') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-5 right-5 z-50 flex flex-col gap-3';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-[#3e6b4f]' : 'bg-red-500';
  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  
  toast.className = `${bgColor} text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 transform transition-all duration-300 translate-x-full opacity-0`;
  toast.innerHTML = `<i class="fa-solid ${icon} text-lg"></i><span class="text-sm font-medium">${message}</span>`;
  
  container.appendChild(toast);

  setTimeout(() => toast.classList.remove('translate-x-full', 'opacity-0'), 10);

  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

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
        showToast("Please upload a valid profile image.", "error");
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
        showToast("Please upload a valid image file.", "error");
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
    // 1. Select the button and show loading state
    const submitBtn = postForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;
    submitBtn.classList.add("opacity-50", "cursor-not-allowed");
    const name = nameInput.value.trim();
    const empID = employeeId.value.trim();
    const phTitle = photoTitle.value.trim();
    const comment = commentInput.value.trim();
    const file = imageInput.files[0];

    if (!file) {
      showToast("Please upload all fields.", "error");
      // Revert button state
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
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
        showToast("There was a problem saving your post. Please try again.", "error");
        // Revert button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
        return;
      }

      postForm.reset();
      imagePreview.classList.add("hidden");
      
      // Reset profile preview and labels
      profilePreview.innerHTML = `<i id="profileIcon" class="fa-regular fa-user text-4xl text-gray-600"></i>`;
      profileFileName.textContent = "No file chosen";
      fileNameSpan.textContent = "No file chosen";
      profileImageData = null;
      
      // Revert button state
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
      
      showToast("Post uploaded successfully!", "success");

      // window.location.href = "wall.html";
    };

    reader.readAsDataURL(file);
  });
}

// SECTION 2: WALL PAGE
if (isWallPage) {
  const postWall = document.getElementById("postWall");
  
  let currentPage = 1;
  let totalPostsCount = 0;
  
  const postsContainer = document.createElement("div");
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  
  postWall.appendChild(postsContainer);

  const loadPosts = async () => {
    if (currentPage === 1) {
      postsContainer.innerHTML = `<p class="text-center text-[#3e6b4f] mt-10"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading moments...</p>`;
    } else {
      loadMoreBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading...`;
      loadMoreBtn.disabled = true;
    }

    const data = await getPosts(currentPage);
    
    // Fallback logic in case the Vercel backend hasn't updated yet
    const isArrayFormat = Array.isArray(data);
    const posts = isArrayFormat ? data : (data.posts || []);
    totalPostsCount = isArrayFormat ? data.length : (data.total || 0);

    if (totalComments) {
      totalComments.innerText = totalPostsCount;
    }

    if (currentPage === 1) {
      postsContainer.innerHTML = "";
    }

    if (posts.length === 0 && currentPage === 1) {
      postsContainer.innerHTML = `<p class="text-center text-gray-400 mt-10">No posts yet.</p>`;
    } else {
      posts.forEach(post => renderPost(post, postsContainer));
    }

    // Handle "Load More" button visibility
    if (currentPage * 5 >= totalPostsCount) {
      loadMoreBtn.classList.add("hidden");
    } else {
      loadMoreBtn.classList.remove("hidden");
      loadMoreBtn.innerText = "Load More Comments";
      loadMoreBtn.disabled = false;
    }
  };

  loadMoreBtn.addEventListener("click", () => {
    currentPage++;
    loadPosts();
  });

  // Initial load
  loadPosts();
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
    const response = await fetch(`https://baxter-pw.vercel.app/api/posts`, {
      // const response = await fetch(`http://localhost:5000/api/posts`, {
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
async function getPosts(page = 1, limit = 5) {
  try {
    const res = await fetch(`https://baxter-pw.vercel.app/api/posts?page=${page}&limit=${limit}`);
    // const res = await fetch(`http://localhost:5000/api/posts?page=${page}&limit=${limit}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching posts:", error);
    return { posts: [], total: 0 };
  }
}

// SECTION 4: RENDER POST
function renderPost(post, container) {
  const postCard = document.createElement("div");
  postCard.className = "mb-4";
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