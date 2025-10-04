required <- c("haven", "jsonlite", "dplyr", "ggplot2")
to_install <- setdiff(required, rownames(installed.packages()))
if (length(to_install)) install.packages(to_install, repos = "https://cloud.r-project.org")

suppressPackageStartupMessages({
library(haven)
library(jsonlite)
library(dplyr)
})
