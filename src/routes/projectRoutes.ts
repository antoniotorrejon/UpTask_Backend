import { Router } from "express"
import { body, param } from "express-validator"
import { ProjectController } from "../controllers/ProjectController"
import { handleInputErrors } from "../middleware/validation"
import { TaskConstroller } from "../controllers/TaskController"
import { projectExist } from "../middleware/project"
import { hasAuthorization, taskBelongToProject, taskExist } from "../middleware/task"
import { authenticate } from "../middleware/auth"
import { TeamMemberController } from "../controllers/TeamController"
import { NoteController } from "../controllers/NoteController"

const router = Router()

router.use(authenticate)

router.post('/',
    body('projectName')
        .notEmpty().withMessage('El nombre del proyecto es obligatorio'),
    body('clientName')
        .notEmpty().withMessage('El nombre del cliente es obligatorio'), 
    body('description')
        .notEmpty().withMessage('La descripción del proyecto es obligatoria'),
    handleInputErrors,
    ProjectController.createProject)

router.get('/', ProjectController.getAllProjects)

router.get('/:id', 
    param('id').isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    ProjectController.getProjectById
)

/** Routes for task */
router.param('projectId', projectExist)

router.put('/:projectId', 
    param('projectId').isMongoId().withMessage('ID no válido'),
    body('projectName')
        .notEmpty().withMessage('El nombre del proyecto es obligatorio'),
    body('clientName')
        .notEmpty().withMessage('El nombre del cliente es obligatorio'), 
    body('description')
        .notEmpty().withMessage('La descripción del proyecto es obligatoria'),
    handleInputErrors,
    hasAuthorization,
    ProjectController.updateProject
)

router.delete('/:projectId', 
    param('projectId').isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    hasAuthorization,
    ProjectController.deleteProject
)

router.post('/:projectId/tasks', 
    hasAuthorization,
    body('name')
        .notEmpty().withMessage('El nombre de la tarea es obligatoria'),
    body('description')
        .notEmpty().withMessage('La descripción de la tarea es obligatoria'),
    handleInputErrors,
    TaskConstroller.createTask
)

router.get('/:projectId/tasks',
    TaskConstroller.getProjectTasks
)

router.param('taskId', taskExist)
router.param('taskId', taskBelongToProject )

router.get('/:projectId/tasks/:taskId', 
    param('taskId').isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    TaskConstroller.getTaskById
)

router.put('/:projectId/tasks/:taskId', 
    hasAuthorization,
    param('taskId').isMongoId().withMessage('ID no válido'),
    body('name')
        .notEmpty().withMessage('El nombre de la tarea es obligatoria'),
    body('description')
        .notEmpty().withMessage('La descripción de la tarea es obligatoria'),
    handleInputErrors,
    TaskConstroller.updateTask
)

router.delete('/:projectId/tasks/:taskId', 
    hasAuthorization,
    param('taskId').isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    TaskConstroller.deleteTask
)

router.post('/:projectId/tasks/:taskId/status',
    param('taskId').isMongoId().withMessage('ID no válido'),
    body('status')
        .notEmpty().withMessage('El estado es obligatorio'),
    handleInputErrors,
    TaskConstroller.updateTaskStatus
)

/**Routes for teams */

router.post('/:projectId/team/find',
    body('email')
        .isEmail().toLowerCase().withMessage('Email no válido'),
    handleInputErrors,
    TeamMemberController.findMemberByEmail
)

router.get('/:projectId/team',
    TeamMemberController.getProjectTeam
)

router.post('/:projectId/team',
    body('id')
        .isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    TeamMemberController.addMemberById
)

router.delete('/:projectId/team/:userId',
    param('userId')
        .isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    TeamMemberController.removeMemberById
)

/** Routes for Notes */
router.post('/:projectId/tasks/:taskId/notes',
    body('content')
        .notEmpty().withMessage('El contenido de la nota es obligatorio'),
    handleInputErrors,
    NoteController.createNote
)

router.get('/:projectId/tasks/:taskId/notes',
    NoteController.getTaskNotes
)

router.delete('/:projectId/tasks/:taskId/notes/:noteId',
    param('noteId').isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    NoteController.deleteNote
)


export default router