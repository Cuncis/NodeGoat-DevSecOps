const core = require("@action/core")
const github = require("@actions/github")
const { Octokit } = require("@octokit/rest")
const fs = require("fs")

function report_parser(npm_report) {
    json_output = JSON.parse(npm_report)
    var final_report = ""
    for (const [key, advisory] of Object.entries(json_output.advisories)) {
        final_report += `
            Severity        : ${advisory.severity}
            Vulnerability   : ${advisory.title}
            Package         : ${advisory.module_name}
            Pathed in       : ${advisory.patched_versions}          
            More info       : ${advisory.url}
        `
    }

    return final_report
}

try {
    const github_token = core.getInput("GITHUB_TOKEN")
    const npm_audit_report = fs.readFileSync("report.json", "utf-8")

    const context = github.context

    if (context.payload.pull_request == null) {
        core.setFailed("PR not found!")
        return
    }

    const pull_request_number = context.payload.pull_request.number

    const octokit = new Octokit({
        auth: github_token
    })

    octokit.rest.issues.createComment({
        ...context.repo,
        issue_number: pull_request_number,
        body: `
            NPM Audit Report        : 

            <details>
                <summary> Show Report! </summary>

                ${report_parser(npm_audit_report)}
            </details>
            
        `
    })
} catch (err) {
    console.log(err)
}
