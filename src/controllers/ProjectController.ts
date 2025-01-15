import type { Request, Response } from "express"
import Project from "../models/Project"

export class ProjectController {  
    static createProject = async (req:  Request, res: Response) => {
        const project = new Project(req.body)

        //Asigna el manager o creador del proyecto
        project.manager = req.user.id

        console.log(req.user)
        try {
            await project.save()
            res.send("Proyecto creado correctamente")
        } catch (error) {
            console.log(error)
        }
    }

    static getAllProjects = async (req:  Request, res: Response) => {
        try {
            const projects = await Project.find({
                $or: [
                    {manager: {$in: req.user.id}},
                    {team: {$in: req.user.id}}
                ]
            })
            res.json(projects)
        } catch (error) {
            console.log(error)
        }
    }

    
    static getProjectById = async (req:  Request, res: Response) : Promise<void> => {
        const { id } = req.params
        try {
            const project = await Project.findById(id).populate('tasks')

            if(!project){
                const error = new Error('Proyecto no encontrado')
                res.status(404).json({error: error.message})
                return
            }

            if(project.manager.toString() !== req.user.id.toString() && !project.team.includes(req.user.id)){
                const error = new Error('Acción no válida')
                res.status(404).json({error: error.message})
                return
            }

            res.json(project)
        } catch (error) {
            console.log(error)
        }
    }

    static updateProject = async (req:  Request, res: Response) : Promise<void> => {
        try {
            req.project.clientName = req.body.clientName
            req.project.projectName = req.body.projectName
            req.project.description = req.body.description
            await req.project.save()
            res.send('Proyecto actualizado correctamente')
        } catch (error) {
            console.log(error)
        }
    }

    static deleteProject = async (req:  Request, res: Response) : Promise<void> => {
        try {
            await req.project.deleteOne()
            res.send('Proyecto eliminado correctamente')

        } catch (error) {
            console.log(error)
        }
    }
}