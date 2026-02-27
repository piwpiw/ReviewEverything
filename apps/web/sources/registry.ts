import { IPlatformAdapter } from "./types";
import { RevuAdapter } from "./adapters/revu";
import { ReviewnoteAdapter } from "./adapters/reviewnote";
import { DinnerQueenAdapter } from "./adapters/dinnerqueen";
import { ReviewPlaceAdapter } from "./adapters/reviewplace";
import { SeouloppaAdapter } from "./adapters/seouloppa";
import { MrBlogAdapter } from "./adapters/mrblog";
import { GangnamFoodAdapter } from "./adapters/gangnamfood";

export const InitializedAdapters: Record<string, IPlatformAdapter> = {
    "revu": new RevuAdapter(),
    "reviewnote": new ReviewnoteAdapter(),
    "dinnerqueen": new DinnerQueenAdapter(),
    "reviewplace": new ReviewPlaceAdapter(),
    "seouloppa": new SeouloppaAdapter(),
    "mrblog": new MrBlogAdapter(),
    "gangnamfood": new GangnamFoodAdapter()
};
