import bcrypt from 'bcrypt'

//Encriptar el password
export const hashPassword = async (password: string)=> {
    const salt = await bcrypt.genSalt(10)
    return password = await bcrypt.hash(password, salt)
}

//Comparar el password enviado con el almacenado en base de datos
export const checkPassword = async (enteredPassword: string, storedHash: string ) => {
    return await bcrypt.compare(enteredPassword, storedHash)
}