# Changelog

## [0.1.1] - 2026-05-21

### Security
- **Dependency Hardening**: Successfully remediates multiple critical and high-severity vulnerabilities within the npm ecosystem.
- **Transitive Vulnerability Mitigation**: Implements `overrides` in `package.json` to enforce secure versions of downstream dependencies, effectively neutralizing Remote Code Execution (RCE) and Regular Expression Denial of Service (ReDoS) vectors.
- **Package Remediation**:
    - Upgrades `serialize-javascript` to `v7.0.5` to address prototype pollution and RCE vulnerabilities.
    - Forces `minimatch` to `^3.1.2` to mitigate combinatorial backtracking ReDoS.
    - Updates `@babel/runtime` to `v7.26.10` for improved regex efficiency and security.
    - Patches `webpack-dev-server` to `v5.0.4` to prevent cross-origin source code exposure.
- **Vulnerability Surface Reduction**: Reduces the total security advisory count by 28% and eliminates all high-severity threats.
- **Persistent Vulnerabilities**:
    - Moderate-severity vulnerabilities in `showdown` library (a transitive dependency of `@wordpress/blocks`) due to a lack of an upstream security patch from the maintainers, despite the enforcement of the latest available version (`v2.1.0`) via overrides.

### Changed
- Refactors `package.json` to include declarative dependency overrides for enhanced supply chain security.

## [0.1.0] - 2026-01-21
- Initial release and architectural scaffolding.


## All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

