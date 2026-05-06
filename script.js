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

  // Reusable Image Preview Handler
  const handleImagePreview = (input, previewEl, fileNameEl, errorMsg, isProfile = false) => {
    input.addEventListener("change", () => {
      const file = input.files[0];
      if (!file) {
        if (isProfile) {
          previewEl.innerHTML = `<i id="profileIcon" class="fa-regular fa-user text-4xl text-gray-600"></i>`;
        } else {
          previewEl.src = "";
          previewEl.classList.add("hidden");
        }
        if (fileNameEl) fileNameEl.textContent = "No file chosen";
        return;
      }

      if (!file.type.startsWith("image/")) {
        showToast(errorMsg, "error");
        input.value = "";
        return;
      }

      if (fileNameEl) fileNameEl.textContent = file.name;

      const reader = new FileReader();
      reader.onload = (e) => {
        if (isProfile) {
          previewEl.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover rounded-xl" />`;
        } else {
          previewEl.src = e.target.result;
          previewEl.classList.remove("hidden");
        }
      };
      reader.readAsDataURL(file);
    });
  };

  handleImagePreview(profileInput, profilePreview, profileFileName, "Please upload a valid profile image.", true);
  handleImagePreview(imageInput, imagePreview, fileNameSpan, "Please upload a valid image file.", false);

  // 2. Handle Form Submission
  postForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = postForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    const setButtonState = (isLoading) => {
      submitBtn.disabled = isLoading;
      submitBtn.innerHTML = isLoading ? `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...` : originalBtnText;
      submitBtn.classList.toggle("opacity-50", isLoading);
      submitBtn.classList.toggle("cursor-not-allowed", isLoading);
    };

    const name = nameInput.value.trim();
    const empID = employeeId.value.trim();
    const phTitle = photoTitle.value.trim();
    const comment = commentInput.value.trim();
    const file = imageInput.files[0];
    const profileFile = profileInput.files[0];

    if (!name || !empID || !phTitle || !file) {
      showToast("Please upload all required fields.", "error");
      return;
    }

    const wordCount = comment ? comment.split(/\s+/).length : 0;
    if (wordCount > 150) {
      showToast("Your story must not exceed 150 words.", "error");
      return;
    }

    setButtonState(true);

    // Build FormData for multipart upload
    const formData = new FormData();
    formData.append("name", name);
    formData.append("empID", empID);
    formData.append("phTitle", phTitle);
    formData.append("comment", comment || "No comment provided.");
    formData.append("date", new Date().toLocaleString());
    formData.append("image", file);

    if (profileFile) {
      formData.append("profileImage", profileFile);
    }

    try {
      const saved = await savePost(formData);

      if (!saved) {
        showToast("Failed to upload post. Please try again.", "error");
        return;
      }

      // Reset form
      postForm.reset();
      imagePreview.classList.add("hidden");
      profilePreview.innerHTML = `<i id="profileIcon" class="fa-regular fa-user text-4xl text-gray-600"></i>`;
      if (profileFileName) profileFileName.textContent = "No file chosen";
      if (fileNameSpan) fileNameSpan.textContent = "No file chosen";

      showToast("Post uploaded successfully!", "success");
    } catch (error) {
      console.error("Submission error:", error);
      showToast("An unexpected error occurred.", "error");
    } finally {
      setButtonState(false);
    }
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
async function savePost(formData) {
  try {
    const response = await fetch(`https://baxter-pw.vercel.app/api/posts`, {
      // const response = await fetch(`http://localhost:5000/api/posts`, {
      method: "POST",
      body: formData  // Send FormData directly, not JSON
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
    <div class="bg-white rounded-2xl p-5 shadow-sm border flex flex-col md:flex-col lg:flex-row justify-between items-start md:items-center gap-6">
      
      <!-- User Info & Story Section -->
      <div class="flex gap-4 items-start flex-1">
        <!-- Profile Image -->
        <div class="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-[#3e6b4f] flex-shrink-0 flex items-center justify-center">
          ${post.profileImageUrl
            ? `<img src="${post.profileImageUrl}" alt=${post.name} class="w-full h-full object-cover onerror="this.style.display='none'" />`
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
      <div class="flex flex-col lg:flex-row items-center gap-4 self-center">
        <button class="text-gray-300 hover:text-red-500 transition-colors text-2xl">
          <i class="fa-solid fa-heart"></i>
        </button>
        
        ${post.imageUrl
          ? `<div class="w-full h-full contain lg:w-48 lg:h-36 rounded-xl overflow-hidden border shadow-sm">
               <img src="${post.imageUrl}" alt="${post.phTitle}" class="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" onerror="this.style.display='none'" />
             </div>`
          : ''
        }
      </div>
    </div>
  `;

  container.appendChild(postCard);
}