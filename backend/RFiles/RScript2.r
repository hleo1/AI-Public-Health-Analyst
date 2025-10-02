source("./RFiles/loadingLibraries.r")
load("RFiles/my_workspace.RData")
# R Code for Analyzing Fast Food Consumption in Children and Adolescents

# Stage 1: Filtering and Data Preparation
# - Filter the master dataframe to include only the target population (ages 2-19).
# - Select only the necessary variables: SEQN (ID), RIDAGEYR (Age), DR1IKCAL (Calories), and DR1FS (Food Source).
# - Remove rows where DR1IKCAL or DR1FS have missing values, as they are crucial for the analysis.
analysis_data <- master %>%
  filter(RIDAGEYR >= 2 & RIDAGEYR <= 19) %>%
  select(SEQN, DR1IKCAL, DR1FS) %>%
  na.omit()

# Stage 2: Calculate Individual Calorie Intake
# - Group data by individual participant (SEQN).
# - Calculate the total daily calories (Total_Kcal) for each person.
# - Calculate the calories consumed from fast food (FF_Kcal). Based on the documentation,
#   DR1FS code '3' represents "Restaurant fast food/pizza".
calorie_summary <- analysis_data %>%
  group_by(SEQN) %>%
  summarise(
    Total_Kcal = sum(DR1IKCAL, na.rm = TRUE),
    FF_Kcal = sum(DR1IKCAL[DR1FS == 3], na.rm = TRUE)
  ) %>%
  ungroup()

# Stage 3: Recoding and Categorization
# - Create a new column for the percentage of calories from fast food.
# - Create a categorical variable (FF_Category) based on the percentage of fast food calories,
#   matching the categories specified in the task.
calorie_summary <- calorie_summary %>%
  mutate(
    FF_Kcal_Pct = ifelse(Total_Kcal > 0, (FF_Kcal / Total_Kcal) * 100, 0),
    FF_Category = case_when(
      FF_Kcal == 0                      ~ "No fast food",
      FF_Kcal_Pct > 0 & FF_Kcal_Pct <= 25 ~ "0 - 25 % Calories from Fast Food",
      FF_Kcal_Pct > 25 & FF_Kcal_Pct <= 50 ~ "25 - 50% Calories from Fast Food",
      FF_Kcal_Pct > 50                  ~ "More than 50% Calories from Fast Food",
      TRUE                              ~ "No fast food" # Fallback for any other cases
    )
  )

# Stage 4: Summarize Data for Plotting
# - Count the number of individuals in each fast food category.
# - Calculate the percentage of the population that falls into each category.
plot_data <- calorie_summary %>%
  count(FF_Category) %>%
  mutate(Percentage = (n / sum(n)) * 100)

# To ensure the bar graph is in a logical order, we define the order of the categories.
category_levels <- c(
  "No fast food",
  "0 - 25 % Calories from Fast Food",
  "25 - 50% Calories from Fast Food",
  "More than 50% Calories from Fast Food"
)

plot_data$FF_Category <- factor(plot_data$FF_Category, levels = category_levels)

print(plot_data$FF_Category)
print(plot_data$Percentage)


# Stage 5: Bar Graph Creation using ggplot2
# - Create the bar graph with FF_Category on the x-axis and Percentage on the y-axis.
# - Use geom_bar with stat = "identity" to plot the calculated percentages.
# - Add text labels on top of each bar to show the exact percentage.
# - Add informative titles and labels for the axes.
# - Use a clean theme and adjust text angles for better readability.
plot_id <- paste0("plot_", format(Sys.time(), "%Y%m%d%H%M%S"))
dir.create(file.path("RFiles", "plot"), showWarnings = FALSE, recursive = TRUE)
plot_path <- file.path("RFiles", "plot", paste0(plot_id, ".png"))

p <- ggplot2::ggplot(plot_data, ggplot2::aes(x = FF_Category, y = Percentage, fill = FF_Category)) +
  ggplot2::geom_bar(stat = "identity", show.legend = FALSE) +
  ggplot2::geom_text(ggplot2::aes(label = paste0(round(Percentage, 1), "%")), vjust = -0.5) +
  ggplot2::labs(
    title = "Fast Food Consumption Among Children and Adolescents (Ages 2-19)",
    x = "Percentage of Daily Calories from Fast Food",
    y = "Percentage of Population (%)"
  ) +
  ggplot2::theme_minimal(base_size = 12) +
  ggplot2::theme(
    plot.title = ggplot2::element_text(hjust = 0.5, face = "bold"),
    axis.text.x = ggplot2::element_text(angle = 20, hjust = 1),
    panel.grid.major.x = ggplot2::element_blank(),
    panel.grid.minor.y = ggplot2::element_blank()
  ) +
  ggplot2::scale_y_continuous(limits = c(0, 100), expand = c(0, 0))

ggplot2::ggsave(plot_path, plot = p, width = 8, height = 5, dpi = 300)
