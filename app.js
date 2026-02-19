import { supabase } from "./script.js";


let signForm = document.querySelector('form');
let errorMessages = document.getElementById('error-messages');

signForm.addEventListener('submit', (e) => {
    e.preventDefault()
    signForm.querySelector("button").disabled = true;
    let userName = document.getElementById('userName').value.trim();
    let firstName = document.getElementById('firstName').value.trim();
    let lastName = document.getElementById('lastName').value.trim();
    let email = document.getElementById('email').value.trim();
    let password = document.getElementById('password').value.trim();

    signUplogicFoo(userName, firstName, lastName, email, password)
})

async function signUplogicFoo(userName, firstName, lastName, email, password) {
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (signupError) {
        if (signupError.message.includes("already")) {
            errorMessages.textContent = "This email is already registered. Please login.";
        } else {
            errorMessages.textContent = signupError.message;
        }
        signForm.querySelector("button").disabled = false;
        return;
    }
    let userId = signupData.user.id

    let { data, error } = await supabase
        .from('profiles')
        .insert([{
            id: userId,
            username: userName,
            firstname: firstName,
            lastname: lastName,
            email: email
        }]);


    if (error) {
        errorMessages.textContent = error;
        signForm.querySelector("button").disabled = false;
    }
    else {
        alert('Signup complete! 🎉');
        window.location.href = '/index.html'
    }
}

