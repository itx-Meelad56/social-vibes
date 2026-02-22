import { supabase } from "./script.js";


async function getUser() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = "/index.html";
        return null;
    }

    return session.user;
}

const user = await getUser();


const { data: profileData } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

document.getElementById("user-name").textContent =
    profileData?.username || "User";



document.getElementById("logoutBtn").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/index.html";
});



let postUrl = "";
const fileInput = document.getElementById("fileInput");

fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        postUrl = e.target.result;
    };
    reader.readAsDataURL(file);
});

document.getElementById("postBtn").addEventListener("click", async () => {
    const content = document.getElementById("postText").value.trim();
    if (!content && !postUrl) return;

    const { error } = await supabase.from("posts").insert([
        {
            content,
            post_url: postUrl,
            user_id: user.id,
        },
    ]);

    if (error) {
        console.log(error);
        return;
    }

    document.getElementById("postText").value = "";
    fileInput.value = "";
    postUrl = "";

    loadPosts();
});



async function loadPosts() {
    const { data: posts, error } = await supabase
        .from("posts")
        .select(`
      *,
      profiles ( username ),
      comments (
        id,
        comment,
        user_id,
        profiles ( username )
      )
    `)
        .order("created_at", { ascending: false });

    if (error) {
        console.log(error);
        return;
    }

    const postUi = document.querySelector(".posts");
    postUi.innerHTML = "";

    posts.forEach((post) => {
        const isOwner = post.user_id === user.id;

        const commentCount = post.comments?.length || 0;

        let commentHtml = "";

        post.comments?.forEach((c) => {
            commentHtml += `
        <div class="comment">
          <strong>${c.profiles?.username || "User"}:</strong>
          ${c.comment}
        </div>
      `;
        });

        postUi.innerHTML += `
      <div class="post-card" id="post-${post.id}">

        <div class="post-header"> 
          <img src="https://tse4.mm.bing.net/th/id/OIP.9_MptOLxjJEGSGukPt9FWQHaHa?cb=defcachec2&rs=1&pid=ImgDetMain&o=7&rm=3" class="avatar">
          <div>
            <h4>${post.profiles?.username || "User"}</h4>
            <span class="post-time">
              ${new Date(post.created_at).toLocaleString()}
            </span>
          </div>

          ${isOwner
                ? `
            <div class="owner-actions">
            <button class="edit-btn" onclick="editPost('${post.id}')">
    Edit
  </button>
  <button class="delete-btn" onclick="deletePost('${post.id}')">
    Delete
  </button>
</div>
          `
                : ""
            }
        </div>

        <div class="post-content">
          <p id="content-${post.id}">${post.content}</p>
        </div>

        ${post.post_url
                ? `
          <div class="post-image">
            <img src="${post.post_url}" />
          </div>
        `
                : ""
            }

        <div class="post-actions">
          <button onclick="likePost('${post.id}')" id="like-${post.id}">
            ❤️ ${post.likes || 0}
          </button>

          <button onclick="toggleComments('${post.id}')">
            💬 ${commentCount} Comments
          </button>
        </div>

        <div class="comments-section" id="comments-${post.id}" style="display:none;">
          ${commentHtml}

          <div class="add-comment">
            <input type="text" placeholder="Write a comment..." id="comment-${post.id}">
            <button onclick="commentAddFoo('${post.id}')">Add</button>
          </div>
        </div>

      </div>
    `;
    });
}

loadPosts();


window.deletePost = async function (postId) {
    const confirmDelete = confirm("Delete this post?");
    if (!confirmDelete) return;

    const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

    if (!error) {
        document.getElementById(`post-${postId}`).remove();
    }
};



window.editPost = async function (postId) {
    const contentElement = document.getElementById(`content-${postId}`);
    const currentText = contentElement.innerText;

    const newText = prompt("Edit your post:", currentText);
    if (!newText) return;

    const { error } = await supabase
        .from("posts")
        .update({ content: newText })
        .eq("id", postId);

    if (!error) {
        contentElement.innerText = newText;
    }
};



window.commentAddFoo = async function (postId) {
    const input = document.getElementById(`comment-${postId}`);
    const commentText = input.value.trim();
    if (!commentText) return;

    const { error } = await supabase.from("comments").insert([
        {
            comment: commentText,
            post_id: postId,
            user_id: user.id,
        },
    ]);

    if (!error) {
        loadPosts();
    }
};



window.toggleComments = function (postId) {
    const section = document.getElementById(`comments-${postId}`);
    section.style.display =
        section.style.display === "none" ? "block" : "none";
};



window.likePost = async function (postId) {
    window.likePost = async function (postId) {

        // Check if already liked
        const { data: existingLike } = await supabase
            .from("likes")
            .select("*")
            .eq("post_id", postId)
            .eq("user_id", user.id)
            .single();

        if (existingLike) {
            // Unlike
            await supabase
                .from("likes")
                .delete()
                .eq("post_id", postId)
                .eq("user_id", user.id);
        } else {
            // Like
            await supabase
                .from("likes")
                .insert([{ post_id: postId, user_id: user.id }]);
        }

        // Get updated like count
        const { count } = await supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("post_id", postId);

        document.getElementById(`like-${postId}`).innerText = `❤️ ${count}`;
    };
};
