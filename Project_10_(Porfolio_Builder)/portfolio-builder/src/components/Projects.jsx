import { ExternalLink } from 'lucide-react';

function Projects({ projects }) {
  if (!projects || projects.length === 0) return null;

  return (
    <div className="glossy-card glass-effect dark:glass-effect-dark rounded-3xl p-8 shadow-2xl mb-8">
      <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-8 text-center">
        Projects
      </h2>

      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((project, index) => (
          <div
            key={index}
            className="glossy-card glass-effect dark:glass-effect-dark rounded-2xl p-6 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/50"
          >
            <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-3">
              {project.title}
            </h3>

            <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
              {project.description}
            </p>

            {project.techStack && (
              <div className="flex flex-wrap gap-2 mb-4">
                {project.techStack.split(',').map((tech, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 text-sm border border-purple-300 dark:border-purple-700 font-medium"
                  >
                    {tech.trim()}
                  </span>
                ))}
              </div>
            )}

            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold transition-colors"
              >
                View Project
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Projects;
