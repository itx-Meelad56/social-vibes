import { supabase } from "./script.js";

let signinForm = document.querySelector('form')
let signinErrorMessages = document.getElementById('errorMessages')

signinForm.addEventListener('submit', (e) => {
    e.preventDefault()
    signinForm.querySelector("button").disabled = true;
    let signinEmail = document.getElementById('email').value.trim()
    let signinpassword = document.getElementById('password').value.trim()

    loginFoo(signinEmail, signinpassword)
})

async function loginFoo(email, password) {
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (loginError) {
        signinErrorMessages.textContent = loginError.message;
        signinForm.querySelector("button").disabled = false;
        return;
    }

    const user = loginData.user;

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (profileError) {
        console.log("Profile fetch error:", profileError);
    } else {
        console.log("Profile data:", profile);
        alert(`Welcome ${profile.username}!`);
        window.location.href = "./feedPage.html";
    };
}


