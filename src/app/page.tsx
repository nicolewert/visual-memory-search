import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SearchDemo } from "@/components/SearchDemo"
import { UploadZone } from "@/components/UploadZone"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 mb-16">
          <Badge variant="secondary" className="mb-4">
            Visual Memory Search
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Search Your Screenshots
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered visual search through your screenshots using OCR text extraction and visual descriptions. 
            Upload images and search through their content instantly.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">
              Upload Screenshots
            </Button>
            <Button variant="outline" size="lg">
              Try Search Demo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <CardTitle>🔍 AI-Powered Search</CardTitle>
              <CardDescription>
                Advanced search through OCR text and visual descriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Search through your screenshots using natural language. Our AI extracts text and creates visual descriptions for comprehensive search.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📸 Smart Upload</CardTitle>
              <CardDescription>
                Drag & drop screenshot processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Upload screenshots and get instant OCR text extraction and AI-generated visual descriptions for searchable content.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>⚡ Real-time Results</CardTitle>
              <CardDescription>
                Instant search with relevance scoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get ranked search results instantly with confidence scores and match highlighting across text and visual content.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-center mb-8">Upload Your Screenshots</h2>
          <UploadZone />
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-center mb-8">Search Your Screenshots</h2>
          <SearchDemo />
        </div>

        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Visual Memory Made Searchable</h2>
          <p className="text-muted-foreground">
            Never lose track of important information in your screenshots again
          </p>
        </div>
      </div>
    </div>
  )
}
