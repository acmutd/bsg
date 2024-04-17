import * as z from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import Difficulty from "@/app/models/Difficulty";

const useCreateRoomForm = () => {
  const formSchema = z.object({
    roomname: z.string(),
    difficulty: z.string(),
    topic: z.string().array(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomname: "",
      difficulty: Difficulty.Easy,
      topic: [],
    },
  });
  const onSubmit = () => {
    const {roomname, difficulty, topic} = form.getValues();

    form.setValue("roomname", roomname);
    form.setValue("difficulty", difficulty);
    form.setValue("topic", topic);

    console.log("form submitted");
  };

  return {
    form,
    onSubmit,
  };
};
export default useCreateRoomForm;
