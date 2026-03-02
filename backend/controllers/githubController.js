const axios = require('axios');

/**
 * Parses GitHub URL to extract owner and repo name
 * Supports formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - owner/repo
 */
const parseGitHubUrl = (url) => {
    const cleanUrl = url.trim().replace(/\/$/, '').replace(/\.git$/, '');
    
    // Pattern for https://github.com/owner/repo
    const httpsPattern = /github\.com\/([^/]+)\/([^/]+)/;
    const match = cleanUrl.match(httpsPattern);
    
    if (match) {
        return { owner: match[1], repo: match[2] };
    }
    
    // Pattern for owner/repo
    const simplePattern = /^([^/]+)\/([^/]+)$/;
    const simpleMatch = cleanUrl.match(simplePattern);
    
    if (simpleMatch) {
        return { owner: simpleMatch[1], repo: simpleMatch[2] };
    }
    
    return null;
};

exports.validateRepo = async (req, res) => {
    try {
        const { repoUrl } = req.body;
        
        if (!repoUrl) {
            return res.status(400).json({ success: false, message: 'Repository URL is required' });
        }
        
        const parsed = parseGitHubUrl(repoUrl);
        
        if (!parsed) {
            return res.status(400).json({ success: false, message: 'Invalid GitHub URL format' });
        }
        
        const { owner, repo } = parsed;
        
        try {
            // Call GitHub API (No token needed for public repo info)
            const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'CloudLab-Simulation-App'
                }
            });
            
            const repoData = response.data;
            
            if (repoData.private) {
                return res.status(200).json({
                    success: false,
                    isPrivate: true,
                    message: 'This repository is private. Please use a public repository.'
                });
            }
            
            return res.status(200).json({
                success: true,
                repoInfo: {
                    name: repoData.name,
                    fullName: repoData.full_name,
                    description: repoData.description,
                    language: repoData.language,
                    stars: repoData.stargazers_count,
                    owner: repoData.owner.login
                }
            });
            
        } catch (apiError) {
            if (apiError.response && apiError.response.status === 404) {
                return res.status(200).json({
                    success: false,
                    message: 'Repository not found. Ensure it is public and spelled correctly.'
                });
            }
            throw apiError;
        }
        
    } catch (error) {
        console.error('GitHub Validation Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate repository. Please try again later.'
        });
    }
};
