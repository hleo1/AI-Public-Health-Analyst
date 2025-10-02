required <- c("haven", "jsonlite")
    to_install <- setdiff(required, rownames(installed.packages()))
    if (length(to_install)) install.packages(to_install, repos = "https://cloud.r-project.org")

    suppressPackageStartupMessages({
    library(haven)
    library(jsonlite)
    })
    
    data <- read_xpt("../data/DEMO_L.xpt")
    # print(colnames(data))
    cat(toJSON(list(results = colnames(data))))