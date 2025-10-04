# A python program to replicate Figures 1 and 2 from the Fast Food Study
# using NHANES 2021 - 2023: https://www.cdc.gov/nchs/products/databriefs/db533.htm
#import dataframes from "data/DEMO_L.xpt" and "data/DR1IFF_L.xpt"

import pandas as pd
import pyreadstat
import matplotlib.pyplot as plt
import numpy as np

# Read SAS transport files with encoding handling
demo_df, meta = pyreadstat.read_xport("data/DEMO_L.xpt", encoding='latin1') # -> SEQN, RIDAGEYR
dr1iff_df, meta2 = pyreadstat.read_xport("data/DR1IFF_L.xpt", encoding='latin1') # -> SEQN, DR1FS, DR1IKCAL 

print("DEMO_L columns:", demo_df.columns.tolist())
print("DR1IFF_L columns:", dr1iff_df.columns.tolist())

# Filter for adolescents (ages 2-19)
adolescents = demo_df[demo_df['RIDAGEYR'].between(2, 19)].copy()

# Merge with food data
merged_df = adolescents.merge(dr1iff_df, on='SEQN', how='inner')

# Remove rows with null DR1FS values
merged_df = merged_df.dropna(subset=['DR1FS'])

# Calculate total calories per person (from all valid food sources)
total_calories = merged_df.groupby('SEQN')['DR1IKCAL'].sum().reset_index()
total_calories.columns = ['SEQN', 'total_calories']

# Filter for fast food (DR1FS = 3: Restaurant fast food/pizza)
fast_food = merged_df[merged_df['DR1FS'] == 3].copy()

# Calculate fast food calories per person
fast_food_calories = fast_food.groupby('SEQN')['DR1IKCAL'].sum().reset_index()
fast_food_calories.columns = ['SEQN', 'fast_food_calories']

# Merge total and fast food calories
calorie_analysis = total_calories.merge(fast_food_calories, on='SEQN', how='left')
calorie_analysis['fast_food_calories'] = calorie_analysis['fast_food_calories'].fillna(0)

# Calculate percentage of calories from fast food
calorie_analysis['fast_food_percentage'] = (calorie_analysis['fast_food_calories'] / calorie_analysis['total_calories']) * 100

# Create categories
def categorize_fast_food(percentage):
    if percentage == 0:
        return "No fast food consumed"
    elif 0 < percentage < 25:
        return "More than 0% to less than 25%"
    elif 25 <= percentage <= 50:
        return "25% - 50%"
    else:
        return "More than 50%"

calorie_analysis['category'] = calorie_analysis['fast_food_percentage'].apply(categorize_fast_food)

# Calculate percentages for each category
category_counts = calorie_analysis['category'].value_counts()
total_adolescents = len(calorie_analysis)
category_percentages = (category_counts / total_adolescents) * 100

# Define the order for x-axis
category_order = ["No fast food consumed", "More than 0% to less than 25%", "25% - 50%", "More than 50%"]
category_percentages_ordered = [category_percentages.get(cat, 0) for cat in category_order]

# Create the bar graph
plt.figure(figsize=(12, 8))
bars = plt.bar(category_order, category_percentages_ordered, color=['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'])

# Customize the plot
plt.title('% of Adolescents Ages 2 - 19 years who reported eating fast food on a given day, by calories consumed:\nUnited States, August 2021 - August 2023', 
          fontsize=14, fontweight='bold', pad=20)
plt.xlabel('Fast Food Consumption Category', fontsize=12, fontweight='bold')
plt.ylabel('Percent', fontsize=12, fontweight='bold')

# Add value labels on bars
for bar, value in zip(bars, category_percentages_ordered):
    plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5, 
             f'{value:.1f}%', ha='center', va='bottom', fontweight='bold')

# Rotate x-axis labels for better readability
plt.xticks(rotation=45, ha='right')
plt.ylim(0, max(category_percentages_ordered) * 1.15)

# Add grid for better readability
plt.grid(axis='y', alpha=0.3)

# Adjust layout to prevent label cutoff
plt.tight_layout()

# Show the plot
plt.show()

# Print summary statistics
print(f"\nSummary Statistics:")
print(f"Total adolescents analyzed: {total_adolescents}")
print(f"\nCategory breakdown:")
for category in category_order:
    count = category_counts.get(category, 0)
    percentage = category_percentages.get(category, 0)
    print(f"{category}: {count} adolescents ({percentage:.1f}%)")

# Create second analysis for age groups and sex
# First, get the sex information from demo data
demo_sex = demo_df[['SEQN', 'RIAGENDR']].copy()  # RIAGENDR: 1=Male, 2=Female

# Merge with our calorie analysis
age_sex_analysis = calorie_analysis.merge(demo_sex, on='SEQN', how='inner')

# Create age groups
def get_age_group(age):
    if 2 <= age <= 11:
        return "2-11"
    elif 12 <= age <= 19:
        return "12-19"
    else:
        return None

# Get ages for each person
ages = adolescents[['SEQN', 'RIDAGEYR']].copy()
age_sex_analysis = age_sex_analysis.merge(ages, on='SEQN', how='inner')
age_sex_analysis['age_group'] = age_sex_analysis['RIDAGEYR'].apply(get_age_group)

# Remove any rows without valid age groups
age_sex_analysis = age_sex_analysis.dropna(subset=['age_group'])

# Create sex labels
age_sex_analysis['sex'] = age_sex_analysis['RIAGENDR'].map({1: 'Boys', 2: 'Girls'})

# Calculate mean percentages by age group and sex
results = []

# 2-19 totals (aggregate across all adolescents 2-19)
overall = age_sex_analysis
if len(overall) > 0:
    results.append({'Age Group': '2-19', 'Sex': 'Total', 'Mean Percent': overall['fast_food_percentage'].mean()})
    for sex in ['Boys', 'Girls']:
        sex_df = overall[overall['sex'] == sex]
        if len(sex_df) > 0:
            results.append({'Age Group': '2-19', 'Sex': sex, 'Mean Percent': sex_df['fast_food_percentage'].mean()})

# Subgroup totals for 2-11 and 12-19
for age_group in ['2-11', '12-19']:
    group_data = age_sex_analysis[age_sex_analysis['age_group'] == age_group]
    if len(group_data) > 0:
        results.append({'Age Group': age_group, 'Sex': 'Total', 'Mean Percent': group_data['fast_food_percentage'].mean()})
        for sex in ['Boys', 'Girls']:
            sex_df = group_data[group_data['sex'] == sex]
            if len(sex_df) > 0:
                results.append({'Age Group': age_group, 'Sex': sex, 'Mean Percent': sex_df['fast_food_percentage'].mean()})

# Convert to DataFrame for easier plotting
results_df = pd.DataFrame(results)

# Create the grouped bar chart
fig, ax = plt.subplots(figsize=(12, 8))

# Define colors
colors = {'Total': '#1f77b4', 'Boys': '#2ca02c', 'Girls': '#87ceeb'}

# Get unique age groups and sexes
age_groups = ['2-19', '2-11', '12-19']
sexes = ['Total', 'Boys', 'Girls']

# Set up bar positions
x = np.arange(len(age_groups))
width = 0.25

# Plot bars for each sex
for i, sex in enumerate(sexes):
    values = []
    for age_group in age_groups:
        value = results_df[(results_df['Age Group'] == age_group) & 
                          (results_df['Sex'] == sex)]['Mean Percent'].iloc[0] if len(results_df[(results_df['Age Group'] == age_group) & (results_df['Sex'] == sex)]) > 0 else 0
        values.append(value)
    
    ax.bar(x + i*width, values, width, label=sex, color=colors[sex], alpha=0.8)

# Customize the plot
ax.set_xlabel('Age Group', fontsize=12, fontweight='bold')
ax.set_ylabel('Mean Percent of Calories', fontsize=12, fontweight='bold')
ax.set_title('Mean Percentage of calories from fast food among children and adolescents ages 2 - 19 years,\nby age group and sex: United States, August 2021- August 2023', 
             fontsize=14, fontweight='bold', pad=20)
ax.set_xticks(x + width)
ax.set_xticklabels(age_groups)
ax.legend()
ax.grid(axis='y', alpha=0.3)

# Add value labels on bars
for i, sex in enumerate(sexes):
    for j, age_group in enumerate(age_groups):
        value = results_df[(results_df['Age Group'] == age_group) & 
                          (results_df['Sex'] == sex)]['Mean Percent'].iloc[0] if len(results_df[(results_df['Age Group'] == age_group) & (results_df['Sex'] == sex)]) > 0 else 0
        ax.text(j + i*width, value + 0.5, f'{value:.1f}%', 
                ha='center', va='bottom', fontweight='bold', fontsize=9)

plt.tight_layout()
plt.show()

# Print summary statistics
print(f"\nMean Percentage of Calories from Fast Food by Age Group and Sex:")
print("=" * 60)
for age_group in age_groups:
    print(f"\n{age_group} years:")
    for sex in sexes:
        value = results_df[(results_df['Age Group'] == age_group) & 
                          (results_df['Sex'] == sex)]['Mean Percent'].iloc[0] if len(results_df[(results_df['Age Group'] == age_group) & (results_df['Sex'] == sex)]) > 0 else 0
        print(f"  {sex}: {value:.1f}%")

