import type { Request, Response } from "express"
import User from "../models/User"
import { checkPassword, hashPassword } from "../utils/auth"
import Token from "../models/Token"
import { generateToken } from "../utils/token"
import { AuthEmail } from "../emails/AuthEmail"
import { generateJWT } from "../utils/jwt"

export class AuthController {
    static createAccount = async (req: Request, res: Response) => {
        try {
            const { password, email } = req.body

            //Prevenir duplicados
            const userExists = await User.findOne({email})
            if(userExists){
                const error = new Error('El usuario ya está registrado')
                res.status(409).json({error: error.message})
                return
            }

            //Crea un usuario nuevo
            const user = new User(req.body)

            //Hash Password
            user.password = await hashPassword(password)

            //Generar token
            const token = new Token()
            token.token = generateToken()
            token.user = user.id

            //Enviar el email
            AuthEmail.sendConfirmationEmail({
                email: user.email, 
                name: user.name,
                token: token.token
            })

            await Promise.allSettled([user.save(), token.save()])
            res.send('Cuenta creada. Revisa tu email para confirmarla.')
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static confirmAccount = async (req: Request, res: Response) => {
        try {
            const {token} = req.body
            const tokenExist = await Token.findOne({token})
            if (!tokenExist) {
                const error = new Error ('Token no válido')
                res.status(404).json({error: error.message})
                return
            }

            const user = await User.findById(tokenExist.user)
            user.confirmed=true

            await Promise.allSettled([user.save(), tokenExist.deleteOne()])
            res.send('Cuenta confirmada correctamente')
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static login = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body

            //Comprobar que el usuario existe
            const user = await User.findOne({email})
            if(!user){
                const error = new Error ('Usuario no encontrado')
                res.status(404).json({error: error.message}) 
                return 
            }
            
            //Comprobar que la cuenta está confirmada y si no enviar un nuevo token para confirmar
            if(!user.confirmed){
                const token = new Token()
                token.user = user.id
                token.token = generateToken()
                await token.save()
                //Enviar el email
                AuthEmail.sendConfirmationEmail({
                    email: user.email, 
                    name: user.name,
                    token: token.token
                })

                const error = new Error ('La cuenta no ha sido confirmada, hemos enviado un email de confirmación')
                res.status(401).json({error: error.message})
                return
            }

            //Comprobar que el password es correcto
            const isPasswordCorrect = await checkPassword(password, user.password)
            if(!isPasswordCorrect){
                const error = new Error ('Password incorrecto')
                res.status(404).json({error: error.message})
                return
            }

            const token = generateJWT({id: user.id})
            res.send(token)

        } catch (error) {
            
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static requestConfirmationCode = async (req: Request, res: Response) => {
        try {
            const { email } = req.body

            //Buscar que el usuario existe
            const user = await User.findOne({email})
            if(!user){
                const error = new Error('El usuario no está registrado')
                res.status(404).json({error: error.message})
                return
            }

            if(user.confirmed){
                const error = new Error('El usuario ya está confirmado')
                res.status(403).json({error: error.message})
                return
            }

            //Generar token
            const token = new Token()
            token.token = generateToken()
            token.user = user.id

            //Enviar el email
            AuthEmail.sendConfirmationEmail({
                email: user.email, 
                name: user.name,
                token: token.token
            })

            await Promise.allSettled([user.save(), token.save()])
            res.send('Te enviamos un nuevo código a tu email, revísalo')
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static forgotPassword = async (req: Request, res: Response) => {
        try {
            const { email } = req.body

            //Buscar que el usuario existe
            const user = await User.findOne({email})
            if(!user){
                const error = new Error('El usuario no está registrado')
                res.status(404).json({error: error.message})
                return
            }

            //Generar token
            const token = new Token()
            token.token = generateToken()
            token.user = user.id
            await token.save()

            //Enviar el email
            AuthEmail.sendPasswordResetToken({
                email: user.email, 
                name: user.name,
                token: token.token
            })
            res.send('Revisa tu email para instruciones')
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static validateToken = async (req: Request, res: Response) => {
        try {
            const {token} = req.body
            const tokenExist = await Token.findOne({token})
            if (!tokenExist) {
                const error = new Error ('Token no válido')
                res.status(404).json({error: error.message})
                return
            }
            res.send('Token válido. Define tu nuevo password')
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static updatePasswordWithToken = async (req: Request, res: Response) => {
        try {
            const {token} = req.params
            const tokenExist = await Token.findOne({token})
            if (!tokenExist) {
                const error = new Error ('Token no válido')
                res.status(404).json({error: error.message})
                return
            }
            const user = await User.findById(tokenExist.user)
            user.password = await hashPassword(req.body.password)

            await Promise.allSettled([user.save(), tokenExist.deleteOne()])

            res.send('El password se modificó correctamente')
            
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static user = async (req: Request, res: Response) => {
        res.json(req.user)
        return
    }

    static updateProfile = async (req: Request, res: Response) => {
        const { name, email } = req.body

        const userExist = await User.findOne({email})
        if(userExist && userExist.id.toString() !== req.user.id.toString()) {
            const error = new Error('Ese email ya está registrado')
            res.status(409).json({error: error.message})
            return
        }

        req.user.name = name
        req.user.email = email

        try {
            await req.user.save()
            res.send('Perfil actualizado correctamente')
        } catch (error) {
            res.status(500).send('Hubo un error')
        }

    }

    static updateCurrentUserPassword = async (req: Request, res: Response) => {
        const { current_password, password } = req.body

        //Comprobamos que el usuario conoce el password actual
        const user = await User.findById(req.user.id)
        const isPasswordCorrect = await checkPassword(current_password, user.password)
        if(!isPasswordCorrect){
            const error = new Error('Ese password actual es incorrecto')
            res.status(401).json({error: error.message})
            return
        }

        try {
            //Si es correcto, asigamos el nuevo password hasheado
            user.password = await hashPassword(password)
            await user.save()
            res.send('El password se modificó correctamente')  
        } catch (error) {
            res.status(500).send('Hubo un error')
        }
    }

    static checkPassword = async (req: Request, res: Response) => {
        const { password } = req.body

        //Comprobamos que el usuario conoce el password actual
        const user = await User.findById(req.user.id)
        const isPasswordCorrect = await checkPassword(password, user.password)
        if(!isPasswordCorrect){
            const error = new Error('El password es incorrecto')
            res.status(401).json({error: error.message})
            return
        }

        res.send('Password correcto')
    }
}