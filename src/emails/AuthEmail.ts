import { transporter } from "../config/nodemailer"

interface IEmail {
    email: string,
    name: string, 
    token: string
}

export class AuthEmail {
    static sendConfirmationEmail = async(user: IEmail)=>{
        const info = await transporter.sendMail({
            from: 'UpTask <admin@uptask.com>',
            to: user.email,
            subject: 'UpTask - Confirma tu cuenta',
            text: 'UpTask - Confirma tu cuenta',
            html: `<p>Hola ${user.name}, has creado tu cuenta en UpTask. Ya está casi todo listo, solo tienes que confirmar tu cuenta</p>
                <p>Visita el siguiente enlace:</p>
                <a href="${process.env.FRONTEND_URL}/auth/confirm-account">Confirmar cuenta</a>
                <p>E introduce el código: <b>${user.token}</b></p>
                <p>Este código expira en 10 minutos</p>
                <p>Muchas gracias por confiar en UpTask!</p>
            `
        }) 

        console.log('Mensaje enviado', info.messageId)
    } 

    static sendPasswordResetToken = async(user: IEmail)=>{
        const info = await transporter.sendMail({
            from: 'UpTask <admin@uptask.com>',
            to: user.email,
            subject: 'UpTask - Reestablece tu password',
            text: 'UpTask - Reestablece tu passowrd',
            html: `<p>Hola ${user.name}, has solicitado reestablecer tu password.</p>
                <p>Visita el siguiente enlace:</p>
                <a href="${process.env.FRONTEND_URL}/auth/new-password">Reestablecer password</a>
                <p>E introduce el código: <b>${user.token}</b></p>
                <p>Este código expira en 10 minutos</p>
                <p>Muchas gracias por confiar en UpTask!</p>
            `
        }) 

        console.log('Mensaje enviado', info.messageId)
    } 
}