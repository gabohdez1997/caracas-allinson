export function translateAuthError(errorMsg: string): string {
    const errorMap: Record<string, string> = {
        "Email not confirmed": "El correo electrónico no ha sido verificado. Por favor revisa tu bandeja de entrada.",
        "Invalid login credentials": "Las credenciales son inválidas. Verifica tu correo y contraseña.",
        "User already registered": "Este usuario ya se encuentra registrado.",
        "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres.",
        "To security purposes, you can only request this once every 60 seconds": "Por motivos de seguridad, solo puedes solicitar esto una vez cada 60 segundos.",
        "Email rate limit exceeded": "Has superado el límite de intentos. Por favor espera e intenta más tarde."
    };

    // Return the translated message if it exists, otherwise return a generic translated error or the original
    return errorMap[errorMsg] || "Ocurrió un error inesperado al procesar la solicitud. (" + errorMsg + ")";
}
