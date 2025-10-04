class dataFrameCode {
    private code;
    private column_names: string[];
    private install_libraries(libraries?: string[]) {
        if (!libraries) libraries = ["haven", "jsonlite", "dplyr", "ggplot2"]
        libraries = libraries.map(elem => `"${elem}"`);
        let libs = libraries.join(", ");
        let libLines = libraries.map(lib => `  library(${lib.replace(/"/g, "")})`).join('\n');
        let code = `
        required <- c(${libs})
        to_install <- setdiff(required, rownames(installed.packages()))
        if (length(to_install)) install.packages(to_install, repos = "https://cloud.r-project.org")
        suppressPackageStartupMessages({
        ${libLines}
        })
        `;
        this.code += code;
        return this;
    }
    constructor(public dataframe_name: string, public libraries?: string[]) {
        this.code = "";
        this.column_names = []
        this.install_libraries(libraries);
    };

    setColumnNames(column_names: string[]) {
        this.column_names = column_names;
    }

    private checkColumnNamesExist(column_names: string[])  {
        const missing = column_names.filter(col => !this.column_names.includes(col));
        if (missing.length) throw new Error(`Columns not found: ${missing.join(", ")}`);
        // return !(missing.length)
    }

    load_xpt(file_path: string) {
        this.code += `${this.dataframe_name} <- read_xpt("${file_path}")`;
        this;
    }

    research() {

    }

    find() {
        this.code += `${this.dataframe_name} = ${this.dataframe_name} %>% select(everything())`
        return this;
    }

    select(column_names: string[]) {
        this.checkColumnNamesExist(column_names);
        const cols = column_names.join(", ");
        this.code += `${this.dataframe_name} = ${this.dataframe_name} %>% select(${cols})`
        return this;
    }

    //special "n" will be outputed
    count(column_name: string) {
        this.checkColumnNamesExist([column_name])
        this.code += `${this.dataframe_name} = ${this.dataframe_name} %>% count(${column_name})`
        this.column_names.push("n");
        return this;
    }

    factor(column_name: string) {
        this.checkColumnNamesExist([column_name])
        this.code += `${this.dataframe_name}\$${column_name} <- factor(${this.dataframe_name}\$${column_name})`
        return this;
    }
 
    na_omit() {
        this.code += `${this.dataframe_name} = ${this.dataframe_name} %>% na.omit()`
        return this;
    }

    // TODO : FIX ERROR CHECKING AND HANDLING HERE
    filter(column_names: string[], formula: string) {
        // Basic checks
        if (!Array.isArray(column_names) || column_names.length === 0) {
            throw new Error("filter requires at least one column name to validate");
        }
        this.checkColumnNamesExist(column_names);
        if (typeof formula !== "string" || formula.trim().length === 0) {
            throw new Error("filter requires a non-empty formula string");
        }
        // Sanity check: referenced columns in formula should exist.
        // Extract tokens that look like identifiers (A1, A_B, etc.)
        const referenced = Array.from(new Set((formula.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [])));
        // Whitelist common R function names and operators to ignore
        const ignore = new Set([
            // dplyr verbs / helpers
            "c", "n", "mean", "sum", "min", "max", "median", "sd", "var", "n_distinct",
            "is.na", "!is.na", "between", "ifelse", "case_when", "any", "all",
            // logicals / constants / base
            "T", "F", "TRUE", "FALSE", "NA", "NaN", "Inf",
            // math
            "abs", "sqrt", "log", "log10", "round", "ceiling", "floor",
        ]);
        const possibleColumns = referenced.filter(token => !ignore.has(token));
        const missing = possibleColumns.filter(name => !this.column_names.includes(name));
        if (missing.length && column_names.length === 0) {
            // Defensive; column_names provided already checked, but formula may contain others
            throw new Error(`filter formula references unknown columns: ${missing.join(", ")}`);
        }
        // Note: we still allow unknowns if they are R functions not in our whitelist.
        this.code += `${this.dataframe_name} = ${this.dataframe_name} %>% filter(${formula})`
        return this;
    }

    mutate(assignments: Record<string, string>) {
        // assignments: { new_col: "expression using existing columns" }
        if (!assignments || typeof assignments !== "object") {
            throw new Error("mutate requires an object of assignments");
        }
        const entries = Object.entries(assignments);
        if (entries.length === 0) {
            throw new Error("mutate requires at least one assignment");
        }
        // Validate new column names and referenced columns in expressions
        const invalidNames = entries
            .map(([name]) => name)
            .filter(name => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name));
        if (invalidNames.length) {
            throw new Error(`Invalid column names in mutate: ${invalidNames.join(", ")}`);
        }
        for (const [name, expr] of entries) {
            if (typeof expr !== "string" || expr.trim().length === 0) {
                throw new Error(`Empty expression for mutate column '${name}'`);
            }
            const referenced = Array.from(new Set((expr.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [])));
            const ignore = new Set([
                "c", "n", "mean", "sum", "min", "max", "median", "sd", "var", "n_distinct",
                "is.na", "!is.na", "between", "ifelse", "case_when", "any", "all",
                "T", "F", "TRUE", "FALSE", "NA", "NaN", "Inf",
                "abs", "sqrt", "log", "log10", "round", "ceiling", "floor",
            ]);
            const possibleColumns = referenced.filter(token => !ignore.has(token));
            const missing = possibleColumns.filter(col => !this.column_names.includes(col));
            if (missing.length) {
                throw new Error(`mutate expression for '${name}' references unknown columns: ${missing.join(", ")}`);
            }
        }
        const assignmentsStr = entries.map(([name, expr]) => `${name} = ${expr}`).join(", ");
        this.code += `${this.dataframe_name} = ${this.dataframe_name} %>% mutate(${assignmentsStr})`
        // Update known columns list: add any new ones not present
        for (const [name] of entries) {
            if (!this.column_names.includes(name)) this.column_names.push(name);
        }
        return this;
    }

    group_by_summarize(groupByColumns: string[], summaries: Record<string, string>, options?: { ungroup?: boolean }) {
        if (!Array.isArray(groupByColumns) || groupByColumns.length === 0) {
            throw new Error("group_by_summarize requires at least one group-by column");
        }
        this.checkColumnNamesExist(groupByColumns);
        if (!summaries || typeof summaries !== "object" || Object.keys(summaries).length === 0) {
            throw new Error("group_by_summarize requires a summaries object: { new_col: 'fn(expr)' }");
        }
        // Validate summary column names and expressions
        const entries = Object.entries(summaries);
        const invalidNames = entries
            .map(([name]) => name)
            .filter(name => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name));
        if (invalidNames.length) {
            throw new Error(`Invalid summary names: ${invalidNames.join(", ")}`);
        }
        const allowedAggs = new Set(["n", "sum", "mean", "min", "max", "median", "sd", "var", "n_distinct"]);
        for (const [name, expr] of entries) {
            if (typeof expr !== "string" || expr.trim().length === 0) {
                throw new Error(`Empty expression for summary '${name}'`);
            }
            // Light validation: ensure expression starts with allowed aggregator or 'sum(x, na.rm = TRUE)' style
            const head = expr.match(/^[A-Za-z_][A-Za-z0-9_]*/);
            if (!head || !allowedAggs.has(head[0])) {
                // Permit complex expressions but warn via error to encourage safe usage
                throw new Error(`Summary '${name}' must start with one of: ${Array.from(allowedAggs).join(', ')}`);
            }
            const referenced = Array.from(new Set((expr.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [])));
            const ignore = new Set([
                ...Array.from(allowedAggs),
                "c", "is.na", "!is.na", "ifelse", "case_when", "any", "all",
                "T", "F", "TRUE", "FALSE", "NA", "NaN", "Inf",
                "abs", "sqrt", "log", "log10", "round", "ceiling", "floor",
                "na.rm"
            ]);
            const possibleColumns = referenced.filter(token => !ignore.has(token));
            const missing = possibleColumns.filter(col => !this.column_names.includes(col));
            if (missing.length) {
                throw new Error(`summary '${name}' references unknown columns: ${missing.join(", ")}`);
            }
        }
        const groupCols = groupByColumns.join(", ");
        const summarizeStr = entries.map(([name, expr]) => `${name} = ${expr}`).join(", ");
        const ungroupStr = options?.ungroup ? " %>% ungroup()" : "";
        this.code += `${this.dataframe_name} = ${this.dataframe_name} %>% group_by(${groupCols}) %>% summarise(${summarizeStr})${ungroupStr}`
        // Update known columns: resulting columns are groupBy + summary names
        this.column_names = [...groupByColumns, ...entries.map(([name]) => name)];
        return this;
    }
    outputRCode() {
        console.log(this.code)
    }
}