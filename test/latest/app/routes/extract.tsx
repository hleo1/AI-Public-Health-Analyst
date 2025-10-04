import type { Route } from "./+types/extract";

import { AxAIOpenAIModel, ai,ax } from '@ax-llm/ax';

type ExtractorOutput = { var_names: string[]; description: string[]; possible_values_and_description: string[] };

export async function Extractor(
  column_names: string[],
  documentation: string
): Promise<ExtractorOutput> {
  const llm = ai({
    name: "openai",
    apiKey: "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",
    config: { model: AxAIOpenAIModel.GPT41Mini }
  });
  const Extractor = ax(
    `column_names: string[], documentation: string -> var_names:string[], description:string[], possible_values_and_description: string[]`
  );

  const result = await Extractor.forward(llm, {
    column_names: column_names,
      documentation: documentation
  })
  return result;
}


export async function action({request }: Route.ActionArgs) {
    let formData = await request.formData();
    let columnNamesStr = formData.get("column_names") as string;
    let documentation = formData.get("documentation") as string;
    
    // Parse comma-separated string into array
    let column_names = columnNamesStr.split(',').map(name => name.trim()).filter(name => name.length > 0);
    
    
    let result = await Extractor(column_names, documentation);

    console.log(result)
    return result;
}
