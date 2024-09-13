import { CreateWebWorkerMLCEngine } from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.46/+esm"

const $ = el => document.querySelector(el)

const $form = $('form')
const $input = $('input')
const $button = $('.send-message')
const $template = $('#message-template')
const $container = $('main')
const $message = $('ul')
const $info = $('small')
const $loading = $('.loading')
const $version = $('.bot-version')

let messages = []
let engine = null
let end = false
let SELECTED_MODEL

async function startEngine(model) {
    $loading?.classList.remove('hidden')
    try {
        engine = await CreateWebWorkerMLCEngine(
            new Worker('/worker.js', { type: 'module' }),
            model,
            {
                initProgressCallback: (info) => {
                    $info.textContent = `${info.text}`
                    if (info.progress === 1 && !end) {
                        end = true
                        $loading?.parentNode?.removeChild($loading)
                        $button.removeAttribute('disabled')
                        addMessage("¡Hola! Soy un Bot.AI que se ejecuta completamente en tu navegador. ¿En qué puedo ayudarte hoy?", 'bot')
                        $input.focus()
                    }
                }
            }
        )
        console.log(`Engine inicializado con el modelo: ${model}`)
    } catch (error) {
        console.error('Error al inicializar el motor:', error)
        addMessage("Error al cargar el modelo seleccionado.", 'bot')
        $loading?.classList.add('hidden')
    }
}

$version.addEventListener('click', async (event) => {
    if (event.target.classList.contains('version-1')) {
        SELECTED_MODEL = 'gemma-2b-it-q4f32_1-MLC'
    } else if (event.target.classList.contains('version-2')) {
        SELECTED_MODEL = 'Llama-3-8B-Instruct-q4f32_1-MLC-1k'
    } else return

    if (SELECTED_MODEL) {
        $version?.parentNode?.removeChild($version)
        await startEngine(SELECTED_MODEL)
    }
})

$form.addEventListener('submit', async (event) => {
    event.preventDefault()

    if (!engine) {
        console.error('Engine no inicializado')
        return
    }

    const messageText = $input.value.trim()
    if (messageText !== '') {
        $input.value = ''
    }

    addMessage(messageText, 'user')
    $button.setAttribute('disabled', '')

    const userMessage = {
        role: 'user',
        content: messageText
    }
    
    messages.push(userMessage)

    try {
        const chunks = await engine.chat.completions.create({
            messages,
            stream: true
        })

        let reply = ""
        const $botMessage = addMessage("", 'bot')

        for await (const chunk of chunks) {
            const choice = chunk.choices[0]
            const content = choice?.delta?.content ?? ""
            reply += content
            $botMessage.textContent = reply
        }

        $button.removeAttribute('disabled')
        messages.push({
            role: 'assistant',
            content: reply
        })
    } catch (error) {
        console.error('Error en la respuesta del bot:', error)
        addMessage("Hubo un error al generar la respuesta.", 'bot')
    }
})

function addMessage(text, sender) {
    const clonedTemplate = $template.content.cloneNode(true)
    const $newMessage = clonedTemplate.querySelector('.message')

    const $who = $newMessage.querySelector('span')
    const $text = $newMessage.querySelector('p')

    $text.textContent = text
    $who.textContent = sender === 'bot' ? 'Bot.AI' : 'Tú'
    $newMessage.classList.add(sender)

    $message.appendChild($newMessage)
    $container.scrollTop = $container.scrollHeight

    return $text
}
