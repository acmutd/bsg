const fs = require('fs')
const path = require('path')
const glob = require('glob')

// 1. find every HTML in your build `out/` folder
const htmlFiles = glob.sync(path.join(__dirname, '../out/*.html'))

htmlFiles.forEach(htmlPath => {
    let html = fs.readFileSync(htmlPath, 'utf8')
    let counter = 0

    // 2. pull out each <script>…</script>
    html = html.replace(
        /<script>([\s\S]*?)<\/script>/g,
        (_, scriptContent) => {
            const trimmed = scriptContent.trim()
            if (!trimmed) return ''   // skip empty blocks

            // 3. emit it to out/extracted-X.js
            const fileName = `extracted-${counter++}.js`
            const destPath = path.join(path.dirname(htmlPath), fileName)
            fs.writeFileSync(destPath, trimmed, 'utf8')

            // 4. swap in an external src
            return `<script src="./${fileName}"></script>`
        }
    )

    // overwrite the HTML
    fs.writeFileSync(htmlPath, html, 'utf8')
})
