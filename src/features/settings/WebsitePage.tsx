import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, isPlatform } from "../../lib/api/client";
import { scopeKey } from "../../app/providers";
import { websiteEditorSchema } from "../../app/website";
import { ErrorPanel, Loading, PageTitle } from "../../components/ui";
import Editor from "./WebsiteEditor";
import "./website-editor.css";
const path = isPlatform ? "/platform/website" : "/tenant/website";

export default function WebsitePage() {
  const [editorVersion, setEditorVersion] = useState(0);
  const query = useQuery({
    queryKey: [...scopeKey(), path],
    queryFn: ({ signal }) => api.request(path, websiteEditorSchema, { signal }),
    refetchOnWindowFocus: false,
  });
  return (
    <>
      <PageTitle
        title="Public website"
        description="Manage the branding, public pages, navigation, footer, and login introduction for this business."
      />
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorPanel error={query.error} retry={() => void query.refetch()} />
      ) : (
        <Editor
          key={editorVersion}
          initial={query.data}
          reload={() => {
            void query.refetch().then((result) => {
              if (result.isSuccess) setEditorVersion((value) => value + 1);
            });
          }}
        />
      )}
    </>
  );
}
