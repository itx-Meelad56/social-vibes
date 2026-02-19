import { supabase } from "./script.js";

async function getUser() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = "./index.html";
        return null;
    }

    return session.user;
}

const user = await getUser();

const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)

document.getElementById('user-name').textContent = data[0].username


document.getElementById("logoutBtn")
    .addEventListener("click", async () => {
        await supabase.auth.signOut();
        window.location.href = "./index.html";
    });

let postUrl = "";

const fileInput = document.getElementById("fileInput");

fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        postUrl = e.target.result;
    };

    reader.readAsDataURL(file);
});


document.getElementById("postBtn")
    .addEventListener("click", async () => {

        const content = document.getElementById("postText").value.trim();

        const { error } = await supabase
            .from("posts")
            .insert([{
                content: content,
                post_url: postUrl,
                user_id: user.id
            }]);

        if (error) {
            console.log(error);
            return;
        }

        document.getElementById("postText").value = "";
        document.getElementById("fileInput").value = "";
        postUrl = "";

        loadPosts();
    });



async function loadPosts() {

    const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.log(error);
        return;
    }

    const postUi = document.querySelector(".posts");
    postUi.innerHTML = "";

    for (let post of posts) {


        const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", post.user_id)
            .single();


        const { data: comments } = await supabase
            .from("comments")
            .select("*")
            .eq("post_id", post.id);

        let commentHtml = "";
        let commentCount = 0;

        if (comments) {
            commentCount = comments.length;

            for (let c of comments) {

                const { data: commentUser } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", c.user_id)
                    .single();

                commentHtml += `
          <div class="comment">
            <strong>${commentUser?.username || "User"}:</strong>
            ${c.comment}
          </div>
        `;
            }
        }

        postUi.innerHTML += `
      <div class="post-card">

        <div class="post-header"> 
            <img src="https://tse4.mm.bing.net/th/id/OIP.9_MptOLxjJEGSGukPt9FWQHaHa?cb=defcachec2&rs=1&pid=ImgDetMain&o=7&rm=3" class="avatar">
            <div>
                <h4>${profile?.username || "User"}</h4>
                <span class="post-time">
                  ${new Date(post.created_at).toLocaleString()}
                </span>
            </div>
        </div>

        <div class="post-content">
            <p>${post.content}</p>
        </div>

        ${post.post_url ? `
        <div class="post-image">
            <img src="${post.post_url}" alt="post image">
        </div>
        ` : ""}

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
                <input 
                  type="text" 
                  placeholder="Write a comment..." 
                  id="comment-${post.id}"
                >
                <button onclick="commentAddFoo('${post.id}')">
                  Add
                </button>
            </div>

        </div>

      </div>
    `;
    }
}

loadPosts();


window.commentAddFoo = async function (postId) {

    const input = document.getElementById(`comment-${postId}`);
    const commentText = input.value.trim();

    if (!commentText) return;


    const { data, error } = await supabase
        .from("comments")
        .insert([{
            comment: commentText,
            post_id: postId,
            user_id: user.id
        }])
        .select()
        .single();

    if (error) {
        console.log(error);
        return;
    }


    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();


    const commentSection = document.getElementById(`comments-${postId}`);

    const newComment = document.createElement("div");
    newComment.classList.add("comment");
    newComment.innerHTML = `
    <strong>${profile?.username || "User"}:</strong>
    ${commentText}
  `;

    commentSection.insertBefore(
        newComment,
        commentSection.querySelector(".add-comment")
    );

    input.value = "";
};



window.toggleComments = function (postId) {

    const section = document.getElementById(`comments-${postId}`);

    if (section.style.display === "none") {
        section.style.display = "block";
    } else {
        section.style.display = "none";
    }
};



window.likePost = async function (postId) {

    const likeBtn = document.getElementById(`like-${postId}`);

    let currentLikes = parseInt(likeBtn.innerText.replace("❤️ ", "")) || 0;
    let newLikes = currentLikes + 1;


    likeBtn.innerText = `❤️ ${newLikes}`;

    await supabase
        .from("posts")
        .update({ likes: newLikes })
        .eq("id", postId);
};

